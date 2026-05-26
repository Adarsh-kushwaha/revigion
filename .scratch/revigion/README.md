# Revigion — implementation issues

Vertical slices for building the Revigion spaced-repetition revision tracker. Implement in numeric order; dependencies in each issue's "Blocked by" section.

Domain language lives in `/CONTEXT.md` at the repo root.

| # | Title | Type | Blocked by |
|---|---|---|---|
| 01 | Environment & cloud setup | HITL | — |
| 02 | Auth + DB schema + RLS + profile bootstrap | AFK | 01 |
| 03 | Full UI + Revision Scheduler + State Machine | AFK | 02 |
| 04 | PWA shell + FCM token registration | HITL (iOS) | 02 |
| 05 | Notification Dispatcher cron | AFK | 03, 04 |
