'use client';

import { getToken } from 'firebase/messaging';
import { getFirebaseMessaging, VAPID_KEY } from '@/lib/firebase/client';
import { registerFcmToken } from '@/app/actions';

/**
 * Requests notification permission, obtains an FCM token, and registers it
 * with the backend. Returns the token string on success, or null on failure.
 *
 * Must be called from a user-gesture handler (e.g. button click).
 */
export async function requestAndRegisterToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    // Register the Firebase SW explicitly and wait for it to activate
    let swReg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!swReg) {
      swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    }
    // Wait for the SW to become active (installing → waiting → active)
    await new Promise<void>((resolve) => {
      if (swReg!.active) { resolve(); return; }
      const sw = swReg!.installing ?? swReg!.waiting;
      if (!sw) { resolve(); return; }
      sw.addEventListener('statechange', function handler() {
        if (this.state === 'activated') { sw.removeEventListener('statechange', handler); resolve(); }
      });
    });

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (!token) return null;

    await registerFcmToken(token);
    return token;
  } catch (err) {
    console.error('[FCM] Failed to get/register token:', err);
    return null;
  }
}
