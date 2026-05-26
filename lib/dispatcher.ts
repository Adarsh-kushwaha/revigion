/**
 * Pure dispatcher module — no runtime-specific imports.
 * Works in both Node.js (vitest) and Deno (Edge Function).
 */

export interface DueRevisionRow {
  revision_id: string;
  question_id: string;
  question_title: string;
  user_id: string;
  token: string;
}

export interface DbContext {
  dueRevisions(slotAt: Date): Promise<DueRevisionRow[]>;
  markSent(revisionId: string, slotAt: Date): Promise<void>;
  deleteToken(token: string): Promise<void>;
}

export interface FcmPayload {
  notification: { title: string; body: string };
  data: { question_id: string; deep_link: string };
}

export interface FcmContext {
  send(
    token: string,
    payload: FcmPayload,
  ): Promise<{ ok: true } | { ok: false; retire: boolean }>;
}

export interface DispatchResult {
  sent: number;
  retired: number;
  skipped: number;
}

/**
 * Dispatch push notifications for revisions due in the current slot.
 *
 * The DB query (dueRevisions) is responsible for:
 *  - Filtering revisions due today in the user's timezone
 *  - Filtering to users whose local hour is in {8, 12, 16, 20}
 *  - Excluding already-sent (revision_id, slot_at) pairs via NOT EXISTS
 *
 * This function handles per-row FCM delivery and book-keeping.
 */
export async function dispatch(
  now: Date,
  ctx: { db: DbContext; fcm: FcmContext },
): Promise<DispatchResult> {
  const { db, fcm } = ctx;

  // Truncate now to the nearest slot hour so the DB key is deterministic.
  // The slot hours are 8, 12, 16, 20 in user local time, but slotAt is a
  // UTC timestamp that we pass to the DB for the idempotency key.
  // We use the whole-hour of `now` as the slot identifier.
  const slotAt = new Date(now);
  slotAt.setUTCMinutes(0, 0, 0);

  const rows = await db.dueRevisions(slotAt);

  let sent = 0;
  let retired = 0;
  let skipped = 0;

  for (const row of rows) {
    const title = row.question_title.length > 40
      ? row.question_title.slice(0, 40)
      : row.question_title;

    const payload: FcmPayload = {
      notification: {
        title,
        body: 'Time to revise',
      },
      data: {
        question_id: row.question_id,
        deep_link: '/subjects',
      },
    };

    const result = await fcm.send(row.token, payload);

    if (result.ok) {
      await db.markSent(row.revision_id, slotAt);
      sent++;
    } else {
      if (result.retire) {
        await db.deleteToken(row.token);
        retired++;
      } else {
        skipped++;
      }
    }
  }

  return { sent, retired, skipped };
}
