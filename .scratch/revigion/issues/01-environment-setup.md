# 01 — Environment & cloud setup

Status: ready-for-agent
Type: HITL

## What to build

One-time setup of external services and `.env.local` so subsequent slices can run.

End-to-end:
- Supabase project provisioned (free tier).
- Google OAuth credentials created in Google Cloud Console and wired into Supabase Auth → Providers → Google.
- Firebase project created with Cloud Messaging enabled; web app registered; VAPID key generated.
- All credentials added to `.env.local` (and Vercel project env when deployed).
- Repo `.env.example` committed listing every key with a comment, no values.

Required env keys:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Acceptance criteria

- [ ] Supabase project exists; URL + anon + service-role keys captured.
- [ ] Google OAuth client configured with Supabase callback URL (`<supabase-url>/auth/v1/callback`); successful test login from Supabase dashboard.
- [ ] Firebase project with web app + FCM enabled; service-account JSON downloaded; VAPID web push key generated.
- [ ] `.env.local` populated and verified by running `next dev` without missing-env warnings.
- [ ] `.env.example` committed.

## Blocked by

None — can start immediately.
