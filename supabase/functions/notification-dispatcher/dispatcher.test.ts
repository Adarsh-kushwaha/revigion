/**
 * Deno-native tests for the dispatcher module.
 * Run with: deno test supabase/functions/notification-dispatcher/dispatcher.test.ts
 *
 * These mirror the vitest tests in lib/__tests__/dispatcher.test.ts.
 * CI uses vitest; these are here for local Deno verification.
 */
import {
  assertEquals,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { dispatch, DbContext, DueRevisionRow, FcmContext, FcmPayload } from './dispatcher.ts';

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

function makeDb(rows: DueRevisionRow[]) {
  const markSentCalls: Array<{ revisionId: string; slotAt: Date }> = [];
  const deleteTokenCalls: string[] = [];

  const db: DbContext = {
    dueRevisions: (_slotAt: Date) => Promise.resolve(rows),
    markSent: (revisionId: string, slotAt: Date) => {
      markSentCalls.push({ revisionId, slotAt });
      return Promise.resolve();
    },
    deleteToken: (token: string) => {
      deleteTokenCalls.push(token);
      return Promise.resolve();
    },
  };

  return { db, markSentCalls, deleteTokenCalls };
}

function makeFcm(
  response: { ok: true } | { ok: false; retire: boolean } = { ok: true },
): { fcm: FcmContext; calls: Array<{ token: string; payload: FcmPayload }> } {
  const calls: Array<{ token: string; payload: FcmPayload }> = [];
  const fcm: FcmContext = {
    send: (token: string, payload: FcmPayload) => {
      calls.push({ token, payload });
      return Promise.resolve(response);
    },
  };
  return { fcm, calls };
}

const now = new Date('2024-06-10T08:30:00Z');

Deno.test('single due revision → 1 send, 1 markSent', async () => {
  const { db, markSentCalls } = makeDb([makeRow()]);
  const { fcm, calls } = makeFcm({ ok: true });

  const result = await dispatch(now, { db, fcm });

  assertEquals(result, { sent: 1, retired: 0, skipped: 0 });
  assertEquals(calls.length, 1);
  assertEquals(calls[0].token, 'token-abc');
  assertEquals(markSentCalls.length, 1);
  assertEquals(markSentCalls[0].revisionId, 'rev-1');
});

Deno.test('no due revisions → 0 sends', async () => {
  const { db } = makeDb([]);
  const { fcm, calls } = makeFcm();

  const result = await dispatch(now, { db, fcm });

  assertEquals(result, { sent: 0, retired: 0, skipped: 0 });
  assertEquals(calls.length, 0);
});

Deno.test('FCM retire:true → deleteToken called', async () => {
  const { db, deleteTokenCalls, markSentCalls } = makeDb([makeRow({ token: 'stale' })]);
  const { fcm } = makeFcm({ ok: false, retire: true });

  const result = await dispatch(now, { db, fcm });

  assertEquals(result, { sent: 0, retired: 1, skipped: 0 });
  assertEquals(deleteTokenCalls, ['stale']);
  assertEquals(markSentCalls.length, 0);
});

Deno.test('two tokens → 2 sends', async () => {
  const { db, markSentCalls } = makeDb([
    makeRow({ token: 'tok-1', revision_id: 'rev-1' }),
    makeRow({ token: 'tok-2', revision_id: 'rev-2' }),
  ]);
  const { fcm, calls } = makeFcm({ ok: true });

  const result = await dispatch(now, { db, fcm });

  assertEquals(result, { sent: 2, retired: 0, skipped: 0 });
  assertEquals(calls.length, 2);
  assertEquals(markSentCalls.length, 2);
});

Deno.test('long title trimmed to 40 chars', async () => {
  const longTitle = 'B'.repeat(60);
  const { db } = makeDb([makeRow({ question_title: longTitle })]);
  const { fcm, calls } = makeFcm({ ok: true });

  await dispatch(now, { db, fcm });

  assertEquals(calls[0].payload.notification.title.length, 40);
  assertEquals(calls[0].payload.notification.title, 'B'.repeat(40));
});
