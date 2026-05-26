# notification-dispatcher Edge Function

Sends push notifications via Firebase Cloud Messaging (FCM) for revisions
that are due in the current slot (08:00, 12:00, 16:00, or 20:00 in the user's
local timezone).

## Architecture

```
pg_cron (hourly) → Edge Function → dispatch() → FCM HTTP v1 API
                                 ↕
                          Supabase DB (service role)
                          - get_due_revisions_for_slot()
                          - notifications_sent (idempotency)
                          - fcm_tokens (retire stale tokens)
```

The pure dispatch logic lives in `lib/dispatcher.ts` (no Deno-specific imports)
so it can be unit-tested with vitest in CI.

## Deployment

```bash
# From the repo root
supabase functions deploy notification-dispatcher
```

## Required Environment Variables

Set these in **Supabase Dashboard → Edge Functions → notification-dispatcher → Secrets**:

| Variable | Description |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase project ID (e.g. `dayschallenge-7d35e`) |
| `FIREBASE_CLIENT_EMAIL` | Service account email from Firebase Console → Project Settings → Service Accounts |
| `FIREBASE_PRIVATE_KEY` | PEM private key from the downloaded JSON key file. Paste the full value including `-----BEGIN PRIVATE KEY-----` header. Literal `\n` sequences are handled automatically. |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by
the Supabase runtime — do not set them manually.

## Database Function

The edge function calls a Postgres function `get_due_revisions_for_slot(p_slot_at timestamptz)`.
Create it once in the Supabase SQL Editor:

```sql
create or replace function get_due_revisions_for_slot(p_slot_at timestamptz)
returns table (
  revision_id  uuid,
  question_id  uuid,
  question_title text,
  user_id      uuid,
  token        text
)
language sql
security definer
set search_path = public
as $$
  select
    r.id              as revision_id,
    q.id              as question_id,
    q.title           as question_title,
    r.user_id,
    ft.token
  from revisions r
  join questions q   on q.id = r.question_id
  join profiles p    on p.id = r.user_id
  join fcm_tokens ft on ft.user_id = r.user_id
  where
    r.completed_at is null
    and r.due_date = (now() at time zone p.timezone)::date
    and extract(hour from (now() at time zone p.timezone)) in (8, 12, 16, 20)
    and not exists (
      select 1
      from notifications_sent ns
      where ns.revision_id = r.id
        and ns.slot_at = p_slot_at
    )
$$;
```

## Scheduling (pg_cron)

See `supabase/migrations/002_pg_cron.sql` for setup instructions.
The job runs every hour; the filter inside the function restricts delivery
to the 4 notification slots.

## Local Testing

```bash
# Unit tests (vitest — no Deno required)
npm test

# Deno tests (requires Deno installed)
deno test supabase/functions/notification-dispatcher/dispatcher.test.ts

# Invoke the deployed function manually
curl -X POST \
  https://aoymkicpvtnfmbspepqn.supabase.co/functions/v1/notification-dispatcher \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{}'
```
