# 02 — Auth + DB schema + RLS + profile bootstrap

Status: ready-for-agent
Type: AFK

## What to build

Google login via Supabase Auth, full DB schema with RLS, and an auto-created profile row carrying timezone.

End-to-end: user clicks Sign in with Google → Supabase OAuth → profiles row created with browser-detected IANA timezone → user redirected to `/` and sees authenticated shell (empty Home Screen with profile dropdown + Sign out). All other tables exist with RLS policies scoping rows to `auth.uid()`.

### Schema

Tables (Postgres / Supabase):

- `profiles` — PK `id` → `auth.users.id`, `timezone` text (IANA, default `'UTC'`), `created_at`.
- `subjects` — `id` uuid, `user_id` uuid → profiles, `name` text, `description` text, `created_at`. Index on `user_id`.
- `questions` — `id` uuid, `subject_id` uuid (cascade delete), `user_id` uuid (denormalised for RLS), `title` text, `link_url` text nullable, `description` text nullable, `created_at`. Index on `subject_id`.
- `revisions` — `id` uuid, `question_id` uuid (cascade delete), `user_id` uuid, `index` int (1..5), `due_date` date nullable, `completed_at` timestamptz nullable. Unique `(question_id, index)`.
- `fcm_tokens` — `id` uuid, `user_id` uuid, `token` text unique, `created_at`, `last_seen` timestamptz.
- `notifications_sent` — `revision_id` uuid, `slot_at` timestamptz, PK `(revision_id, slot_at)`. Idempotency only.

RLS: every table has `user_id = auth.uid()` SELECT/INSERT/UPDATE/DELETE policy. `notifications_sent` written by service-role only; user-readable for own revisions via join.

Profile bootstrap: Postgres trigger on `auth.users` INSERT inserts a `profiles` row with `timezone = COALESCE(raw_user_meta_data->>'timezone', 'UTC')`. Client passes detected TZ to OAuth signup via metadata when available; otherwise updatable from profile dropdown later.

### UI

Two routes:
- `/login` — single Sign in with Google button. Public.
- `/` — authenticated shell only. Header (app name + profile icon). Profile dropdown contains: email, Timezone (select from IANA list, defaults to detected), Sign out. Body shows empty state copy `"No subjects yet. Tap + to add one."` (Add button non-functional placeholder for now).

## Acceptance criteria

- [ ] Google sign-in completes and redirects to `/`.
- [ ] `profiles` row exists for new user after first login with IANA TZ filled.
- [ ] User can change timezone from profile dropdown; persists across reloads.
- [ ] Sign out works.
- [ ] All six tables exist with RLS enabled; manual SQL query with another user's JWT returns zero rows.
- [ ] Unauthenticated visit to `/` redirects to `/login`.

## Blocked by

- #01

