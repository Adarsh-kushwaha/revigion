# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@CONTEXT.md

## Commands

- `npm run dev` — start Next.js dev server on :3000
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- `npm test` — Vitest (one-shot, `vitest run`)
- `npx vitest run lib/__tests__/scheduler.test.ts` — run a single test file
- `npx vitest run -t "name"` — run a single test by name
- `npm run gen:splash` — regenerate PWA splash images into `public/`

Supabase Edge Function (`supabase/functions/notification-dispatcher`) runs under Deno and is excluded from Vitest via `vitest.config.ts`.

## Stack

- **Next.js 16.2.6** (App Router) — see warning in `AGENTS.md`: APIs/conventions may diverge from older Next; consult `node_modules/next/dist/docs/` before writing code.
- **React 19**, **Tailwind v4** (`@tailwindcss/postcss`), shadcn (`components.json`, `components/ui/`).
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) for auth + Postgres; RLS-enforced.
- **Firebase Cloud Messaging** for push notifications (`firebase` client SDK, `firebase-admin` for Edge dispatch).

## Architecture

### Domain model (see `CONTEXT.md` for canonical terminology)

Subject → Question → 5 Revisions. R1 auto-completes on Question creation; R2..R5 scheduled with gaps 3/5/10/15 days, each relative to the **previous completed Revision** (not creation date). All due dates are stored as `date` (not timestamptz) and interpreted in the user's IANA timezone (`profiles.timezone`).

Question state precedence (`lib/question-state.ts`): `Completed > Missed > DueToday > Normal`. A Question is `Missed` if any pending Revision's due_date is before today in user TZ; once missed, no future Revisions schedule until the missed one is completed.

### Data layer

- Schema: `supabase/migrations/001_initial_schema.sql` — `profiles`, `subjects`, `questions`, `revisions`, `fcm_tokens`, `notifications_sent`. All tables have RLS policies scoping by `auth.uid()`. `notifications_sent (revision_id, slot_at)` is the idempotency key for push dispatch.
- pg_cron job: `supabase/migrations/002_pg_cron.sql`.
- Server-side Supabase client: `lib/supabase/server.ts` (uses cookies via `@supabase/ssr`). Browser client: `lib/supabase/client.ts`.

### Auth flow

`middleware.ts` runs on every non-static route, refreshes the Supabase session via `createServerClient`, redirects unauthenticated users to `/login` and authenticated users away from `/login`. Matcher excludes `_next/static`, `_next/image`, `favicon.ico`, `auth/callback`, manifest, icons, FCM SW, and image assets. OAuth callback handled in `app/auth/callback/`.

### Server actions

`app/actions.ts` is the single `'use server'` boundary. Pages are React Server Components that load data; mutations (create/complete/delete subject/question/revision) go through actions, which call `revalidatePath` and re-derive `questionState` server-side. Client components (`components/*-client.tsx`) handle interactivity and call actions.

### Notification dispatch

`lib/dispatcher.ts` is **runtime-agnostic** (no Node/Deno imports) — consumed by both Vitest and the Deno Edge Function `supabase/functions/notification-dispatcher/`. It takes `DbContext` + `FcmContext` and processes due revisions per slot (08/12/16/20 user-local). The slot key is `slotAt` truncated to the UTC hour; `notifications_sent` row insert is idempotent. FCM send failures with `retire: true` delete the token from `fcm_tokens`.

When changing dispatcher logic, keep it free of Node-only or Deno-only imports — that constraint is what lets it be unit-tested with Vitest while running in Deno in prod.

### Scheduler

`lib/scheduler.ts` computes the next due date in **calendar space** in the user's TZ (formats `lastCompletedAt` to `YYYY-MM-DD` in `userTimezone`, then adds gap days via `Date.UTC`). Do not use raw `Date` math — TZ drift will break day boundaries.
