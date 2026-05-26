# 04 — PWA shell + FCM token registration

Status: ready-for-agent
Type: HITL (iOS device verification)

## What to build

Make the app installable as a PWA, register a service worker that handles incoming FCM messages, and persist FCM tokens per device so the dispatcher (#05) can fan-out pushes.

End-to-end: user opens app on a supported device → if notification permission not granted, sticky "Enable notifications" banner appears on Home Screen → tap triggers browser permission prompt (must be from user gesture for iOS) → on grant, FCM token generated and POSTed to a server action that upserts into `fcm_tokens` (deduped by token string) → banner disappears.

### Pieces

- `manifest.webmanifest` with app name, icons, theme color, display: standalone, start_url `/`.
- Service worker registered from a top-level script that:
  - On install/activate: standard PWA SW lifecycle.
  - Hosts the FCM background message handler (`firebase-messaging-sw.js` per Firebase web push convention).
- Client helper that:
  - Detects current notification permission state.
  - Triggers permission prompt only on explicit user gesture (banner tap).
  - On grant, calls `getToken` with the VAPID key and POSTs to `registerFcmToken` server action.
- `registerFcmToken(token)` server action: upsert into `fcm_tokens` keyed by `(user_id, token)`, refreshes `last_seen`.
- `pruneFcmToken(token)` helper (called from #05 dispatcher on FCM 404/410).
- iOS guidance UI: small "?" link next to banner explaining "Add to Home Screen first" for iOS Safari users. Detect iOS Safari + not-installed and show this hint.

### Foreground vs background

- Foreground push (app open): show in-app toast with title + body, click-to-navigate to deep link path.
- Background push (app closed / SW): `firebase-messaging-sw.js` shows OS-level notification; click handler opens `/questions/<id>` deep link if `question_id` in payload data.

## Acceptance criteria

- [ ] Manifest + icons present; Lighthouse "Installable" passes.
- [ ] Service worker registers without errors on production build.
- [ ] Banner appears only when permission != granted and hides on grant or dismiss.
- [ ] Permission prompt fires only from a user gesture.
- [ ] On grant, an FCM token row is upserted; reloads do not create duplicates.
- [ ] On iOS Safari (uninstalled), banner shows "Add to Home Screen first" hint.
- [ ] Test push from Firebase console arrives in foreground (toast) and background (OS notification) on at least one Android Chrome and one iOS 16.4+ home-screen-installed PWA.
- [ ] Background notification click opens app to `/questions/<id>` when payload contains `question_id`.

### Tests

- [ ] Server-action unit test: `registerFcmToken` upserts and dedupes by token.

## Blocked by

- #02

