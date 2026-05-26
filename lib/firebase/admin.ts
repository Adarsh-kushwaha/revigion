import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

/**
 * Initialises (or returns an existing) Firebase Admin app.
 *
 * The FIREBASE_PRIVATE_KEY env var should contain the full PEM string.
 * When stored in .env files, newlines are typically escaped as \n — this
 * handles both the escaped form and the literal form.
 */
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    }),
  });
}

/**
 * Returns the Firebase Admin Messaging instance.
 * Use this server-side to send push notifications via FCM.
 */
export function getAdminMessaging(): Messaging {
  return getMessaging(getAdminApp());
}
