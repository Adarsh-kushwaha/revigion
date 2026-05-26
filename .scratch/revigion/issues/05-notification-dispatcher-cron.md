# 05 — Notification Dispatcher cron

Status: ready-for-agent
Type: AFK

## What to build

Hourly Supabase Edge Function, triggered by `pg_cron`, that finds all Revisions due "now" in each user's local clock-slot (08:00 / 12:00 / 16:00 / 20:00) and fans out an FCM push per Question to each of the user's registered tokens. Idempotent: a given `(revision_id, slot_at)` is delivered at most once.

End-to-end: cron tick at top of hour (UTC) → Edge Function joins `revisions × questions × profiles × fcm_tokens` and filters to rows whose user-local current time equals one of the four slots and whose `due_date` equals today-in-user-TZ and `completed_at IS NULL` → for each (revision, token), if no row exists in `notifications_sent` for `(revision_id, slot_at)`, send FCM push and insert idempotency row → on FCM "not registered" / 404 / 410 error, delete that token.

### Dispatcher module (deep, I/O-bound)

Conceptual interface, testable with a fake FCM client + in-memory DB:
```
dispatch(now: Date, ctx: {
  db: { dueRevisions(slotAt): Row[], markSent(revisionId, slotAt), deleteToken(token) },
  fcm: { send(token, payload): Promise<{ ok: true } | { ok: false, retire: boolean }> },
}): Promise<{ sent: number, retired: number, skipped: number }>
```

### Push payload

```
notification: { title: <Question.title trimmed to 40>, body: "Time to revise" }
data: { question_id: <uuid>, deep_link: "/questions/<uuid>" }
```
Per-Question push (one per due Revision), not batched. Click opens app to `/questions/<id>` via SW click handler from #04.

### Schedule

`pg_cron` job runs at minute 0 of every hour. Edge Function internally derives the user-local slot from each user's TZ: only users whose current local hour ∈ {8, 12, 16, 20} get processed in that tick.

## Acceptance criteria

- [ ] Edge Function deployed and callable.
- [ ] `pg_cron` job scheduled at `0 * * * *` hitting the Edge Function.
- [ ] Function processes exactly the users whose local hour is currently in {8, 12, 16, 20}.
- [ ] Each `(revision_id, slot_at)` results in exactly one FCM send per token even if the cron tick re-runs.
- [ ] FCM 404/410 responses prune the offending token from `fcm_tokens`.
- [ ] Revisions with `completed_at IS NOT NULL` are skipped.
- [ ] Revisions with `due_date != today_in_user_tz` are skipped (covers Missed and not-yet-due).
- [ ] Receiving a push on a test device deep-links to the correct Question Screen.

### Tests

- [ ] Integration test for Dispatcher module against a fake FCM client + in-memory `db`:
  - Single user, single due Revision → 1 send, 1 idempotency row.
  - Same call repeated → 0 additional sends.
  - User completes Revision between slots → next slot skips.
  - FCM returns retire=true → token deleted; subsequent call to that user with another token still works.
  - User with two tokens → 2 sends, idempotency keyed by `(revision_id, slot_at)` not by token (clarify: idempotency per `(revision_id, slot_at, token)` if double-send to same device is the concern).

## Blocked by

- #03
- #04

