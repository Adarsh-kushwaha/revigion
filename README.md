# Revigion

**A spaced-repetition revision tracker with push reminders, built as an installable PWA.**

Add the questions you want to retain (DSA problems, interview topics, anything), group them by subject, and Revigion schedules five revisions per question and nudges you with push notifications when one is due.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3FCF8E?logo=supabase&logoColor=white)
![Vitest](https://img.shields.io/badge/tested_with-Vitest-6E9F18?logo=vitest&logoColor=white)

## Features

- **Subjects → Questions → Revisions.** Each question gets a fixed lifecycle of 5 revisions. R1 completes on creation; R2–R5 follow gaps of **3 / 5 / 10 / 15 days**, each measured from the *previously completed* revision, not the creation date.
- **Clear card states** with a fixed precedence: Completed → Missed → Due today → Normal.
- **Missed-revision handling:** a missed revision pauses the schedule until it's done, so you never get a pile-up of overdue reminders.
- **Push reminders** at 08:00, 12:00, 16:00 and 20:00 in *your* timezone, until the revision is completed.
- **Timezone-correct scheduling.** Due dates are stored as calendar dates and interpreted in the user's IANA timezone.
- **Dashboard** with a 24-week activity heatmap plus current and longest streaks.
- **Optimistic UI** for creating, renaming and deleting subjects, with rollback and a toast on failure.
- **Installable PWA** with an app manifest, icons, iOS splash screens and an iOS "Add to Home Screen" hint for push support.
- **Google sign-in** via Supabase Auth, with Row-Level Security on every table.

## Architecture

```
Browser (React 19 client components)
   │  server actions (app/actions.ts — the single 'use server' boundary)
   ▼
Next.js 16 App Router (RSC pages, middleware refreshes the Supabase session)
   │
   ▼
Supabase Postgres (RLS by auth.uid())  ──pg_cron (hourly)──▶  Edge Function: notification-dispatcher
                                                                │  dispatch() from lib/dispatcher.ts
                                                                ▼
                                                     Firebase Cloud Messaging ──▶ device
```

### Key decisions

| Decision | Why |
| --- | --- |
| **One server-action module** (`app/actions.ts`) for all reads and mutations | A single, auditable server boundary. Question state is re-derived on the server after every mutation, so the client never computes authoritative state. |
| **Calendar-space date math** (`lib/scheduler.ts`) | "Due in 3 days" means 3 calendar days in the user's timezone. Raw `Date` arithmetic drifts across DST and UTC day boundaries, so dates are formatted to `YYYY-MM-DD` in the user's TZ and offset with `Date.UTC`. |
| **Runtime-agnostic dispatcher** (`lib/dispatcher.ts`) | The dispatch logic has no Node or Deno imports. It takes injected `DbContext` / `FcmContext`, so the same code is unit-tested in Vitest and runs in the Deno Edge Function in production. |
| **Idempotent notifications** | `notifications_sent (revision_id, slot_at)` is the idempotency key, so a retried cron run can't double-notify. Tokens that FCM reports as dead are retired automatically. |
| **Stale-while-revalidate client cache** (`lib/client-cache.ts`) | Versioned, per-user `localStorage` entries with a 30-minute TTL make back/forward navigation instant. A hard reload bypasses the cache, and completing a revision invalidates everything. |
| **Browser-only state read without effects** | Values like notification permission are read with a `useSyncExternalStore` hydration guard instead of `setState` inside `useEffect`, which avoids cascading re-renders and SSR hydration mismatches. |

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4, shadcn/ui primitives |
| Auth and data | Supabase (`@supabase/ssr`), Postgres with RLS, pg_cron |
| Push | Firebase Cloud Messaging (web SDK and HTTP v1 API) |
| Testing | Vitest |

## Project structure

```
app/
  actions.ts                 # all server actions
  login/, auth/callback/     # Google OAuth via Supabase
  subjects/[id]/questions/[qid]/   # nested routes with loading.tsx skeletons
  settings/                  # test notification, sign out
components/                  # *-client.tsx = interactive islands, ui/ = primitives
lib/
  scheduler.ts               # next-due-date calculation (TZ-aware)
  question-state.ts          # Completed > Missed > DueToday > Normal
  dispatcher.ts              # notification dispatch (runtime-agnostic)
  streak.ts                  # heatmap and streaks
  client-cache.ts            # localStorage SWR cache
  __tests__/                 # unit tests for the above
supabase/
  migrations/                # schema, RLS policies, pg_cron job
  functions/notification-dispatcher/   # Deno Edge Function
middleware.ts                # session refresh and auth redirects
```

## Getting started

**Prerequisites:** Node.js 20+, a Supabase project, and a Firebase project with Cloud Messaging enabled.

```bash
git clone https://github.com/Adarsh-kushwaha/revigion.git
cd revigion
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

1. Apply the SQL in `supabase/migrations/` to your Supabase project, in order.
2. Enable Google as an auth provider (see [`supabase/config.md`](supabase/config.md)).
3. Deploy the Edge Function and set its secrets (see [`supabase/functions/notification-dispatcher/README.md`](supabase/functions/notification-dispatcher/README.md)).

### Environment variables

| Variable | Used by |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase browser and server clients |
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | FCM token registration in the browser |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | `firebase-admin` on the server (never expose these to the client) |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint (Next.js core-web-vitals and TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests (scheduler, question state, dispatcher) |
| `npm run gen:splash` | Regenerate PWA splash images |

CI (`.github/workflows/ci.yml`) runs lint, typecheck and tests on every push and pull request.

## Testing

Unit tests cover the logic that's easy to get subtly wrong:

- **Scheduler:** gap calculation relative to the last completed revision, and timezone day boundaries.
- **Question state:** precedence rules and missed detection.
- **Dispatcher:** per-slot dispatch, idempotency, and retiring dead FCM tokens.

The Edge Function's Deno entry point is excluded from Vitest. Its logic is covered through `lib/dispatcher.ts`.

## Roadmap

- Component tests for the optimistic create/rename/delete flows
- Playwright smoke test for sign-in → add question → complete revision
