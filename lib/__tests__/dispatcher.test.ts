import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dispatch, DbContext, FcmContext, DueRevisionRow } from '../dispatcher';

function makeRow(overrides: Partial<DueRevisionRow> = {}): DueRevisionRow {
  return {
    revision_id: 'rev-1',
    question_id: 'q-1',
    question_title: 'What is the capital of France?',
    user_id: 'user-1',
    token: 'token-abc',
    ...overrides,
  };
}

function makeDb(rows: DueRevisionRow[]): DbContext & {
  markSentCalls: Array<{ revisionId: string; slotAt: Date }>;
  deleteTokenCalls: string[];
} {
  const markSentCalls: Array<{ revisionId: string; slotAt: Date }> = [];
  const deleteTokenCalls: string[] = [];

  return {
    markSentCalls,
    deleteTokenCalls,
    dueRevisions: vi.fn().mockResolvedValue(rows),
    markSent: vi.fn(async (revisionId: string, slotAt: Date) => {
      markSentCalls.push({ revisionId, slotAt });
    }),
    deleteToken: vi.fn(async (token: string) => {
      deleteTokenCalls.push(token);
    }),
  };
}

function makeFcm(
  response: { ok: true } | { ok: false; retire: boolean } = { ok: true },
): FcmContext {
  return {
    send: vi.fn().mockResolvedValue(response),
  };
}

const now = new Date('2024-06-10T08:30:00Z');

describe('dispatch', () => {
  it('single user, single due revision → 1 send, 1 markSent call', async () => {
    const db = makeDb([makeRow()]);
    const fcm = makeFcm({ ok: true });

    const result = await dispatch(now, { db, fcm });

    expect(result).toEqual({ sent: 1, retired: 0, skipped: 0 });
    expect(fcm.send).toHaveBeenCalledOnce();
    expect(fcm.send).toHaveBeenCalledWith('token-abc', {
      notification: { title: 'What is the capital of France?', body: 'Time to revise' },
      data: { question_id: 'q-1', deep_link: '/subjects' },
    });
    expect(db.markSentCalls).toHaveLength(1);
    expect(db.markSentCalls[0].revisionId).toBe('rev-1');
    // slotAt must be on the whole hour
    expect(db.markSentCalls[0].slotAt.getUTCMinutes()).toBe(0);
    expect(db.markSentCalls[0].slotAt.getUTCSeconds()).toBe(0);
  });

  it('no due revisions → 0 sends (idempotency at DB level)', async () => {
    const db = makeDb([]); // DB already filtered out sent rows
    const fcm = makeFcm();

    const result = await dispatch(now, { db, fcm });

    expect(result).toEqual({ sent: 0, retired: 0, skipped: 0 });
    expect(fcm.send).not.toHaveBeenCalled();
    expect(db.markSentCalls).toHaveLength(0);
  });

  it('FCM returns retire:true → deleteToken called, retired count incremented', async () => {
    const db = makeDb([makeRow({ token: 'stale-token' })]);
    const fcm = makeFcm({ ok: false, retire: true });

    const result = await dispatch(now, { db, fcm });

    expect(result).toEqual({ sent: 0, retired: 1, skipped: 0 });
    expect(db.deleteTokenCalls).toEqual(['stale-token']);
    expect(db.markSentCalls).toHaveLength(0);
  });

  it('FCM returns retire:false → skipped count incremented, token NOT deleted', async () => {
    const db = makeDb([makeRow()]);
    const fcm = makeFcm({ ok: false, retire: false });

    const result = await dispatch(now, { db, fcm });

    expect(result).toEqual({ sent: 0, retired: 0, skipped: 1 });
    expect(db.deleteTokenCalls).toHaveLength(0);
    expect(db.markSentCalls).toHaveLength(0);
  });

  it('user with two tokens → 2 sends', async () => {
    const rows = [
      makeRow({ token: 'token-1', revision_id: 'rev-1' }),
      makeRow({ token: 'token-2', revision_id: 'rev-2' }),
    ];
    const db = makeDb(rows);
    const fcm = makeFcm({ ok: true });

    const result = await dispatch(now, { db, fcm });

    expect(result).toEqual({ sent: 2, retired: 0, skipped: 0 });
    expect(fcm.send).toHaveBeenCalledTimes(2);
    expect(db.markSentCalls).toHaveLength(2);
  });

  it('already-sent revisions not returned by DB → 0 sends on repeat call', async () => {
    // First call: 1 row returned
    const db = makeDb([makeRow()]);
    const fcm = makeFcm({ ok: true });
    await dispatch(now, { db, fcm });

    // Second call: DB returns empty (NOT EXISTS filtered them out)
    const db2 = makeDb([]);
    const fcm2 = makeFcm({ ok: true });
    const result2 = await dispatch(now, { db: db2, fcm: fcm2 });

    expect(result2).toEqual({ sent: 0, retired: 0, skipped: 0 });
    expect(fcm2.send).not.toHaveBeenCalled();
  });

  it('long question title is trimmed to 40 chars in FCM payload', async () => {
    const longTitle = 'A'.repeat(60);
    const db = makeDb([makeRow({ question_title: longTitle })]);
    const fcm = makeFcm({ ok: true });

    await dispatch(now, { db, fcm });

    const call = (fcm.send as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1].notification.title).toHaveLength(40);
    expect(call[1].notification.title).toBe('A'.repeat(40));
  });

  it('short question title is not padded or truncated', async () => {
    const shortTitle = 'Short question';
    const db = makeDb([makeRow({ question_title: shortTitle })]);
    const fcm = makeFcm({ ok: true });

    await dispatch(now, { db, fcm });

    const call = (fcm.send as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1].notification.title).toBe('Short question');
  });
});
