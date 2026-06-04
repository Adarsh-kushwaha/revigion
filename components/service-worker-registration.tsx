'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ForegroundToast {
  title: string;
  body: string;
  deepLink?: string;
}

/**
 * Registers the Firebase Cloud Messaging service worker and handles foreground
 * push notifications by showing an in-app toast.
 *
 * Rendered once in the root layout; has no visible output until a push arrives.
 */
export function ServiceWorkerRegistration() {
  const router = useRouter();
  const [toast, setToast] = useState<ForegroundToast | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Register both service workers in parallel — neither needs to wait for the other.
    Promise.all([
      navigator.serviceWorker.register('/sw.js', { scope: '/' }),
      navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' }),
    ]).catch((err) => {
      console.error('[SW] Registration failed:', err);
    });

    // Defer Firebase messaging init until the main thread is idle so the
    // ~80KB Firebase chunk stays off the hydration critical path.
    const initMessaging = async () => {
      // Dynamic imports keep the Firebase SDK out of the main client bundle —
      // it loads only after the main thread reports idle.
      const [{ onMessage }, { getFirebaseMessaging }] = await Promise.all([
        import('firebase/messaging'),
        import('@/lib/firebase/client'),
      ]);
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;
      onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? 'Revigion';
        const body = payload.notification?.body ?? 'Time to revise';
        const deepLink = payload.data?.deep_link;
        setToast({ title, body, deepLink });
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
        dismissTimer.current = setTimeout(() => setToast(null), 5000);
      });
    };

    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const w = window as IdleWindow;
    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    if (typeof w.requestIdleCallback === 'function') {
      idleHandle = w.requestIdleCallback(() => { void initMessaging(); }, { timeout: 3000 });
    } else {
      timeoutHandle = setTimeout(() => { void initMessaging(); }, 2000);
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      if (idleHandle !== null && typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(idleHandle);
      if (timeoutHandle !== null) clearTimeout(timeoutHandle);
    };
  }, []);

  if (!toast) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999,
        maxWidth: '320px',
        width: 'calc(100vw - 32px)',
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(17,17,16,0.14)',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(17,17,16,0.12)',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        animation: 'slideInFromRight 0.25s ease-out',
        cursor: toast.deepLink ? 'pointer' : 'default',
      }}
      onClick={() => {
        if (toast.deepLink) router.push(toast.deepLink);
        setToast(null);
      }}
    >
      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontWeight: 600, fontSize: '14px', color: '#111110', flex: 1 }}>
          {toast.title}
        </span>
        <button
          aria-label="Dismiss notification"
          onClick={(e) => { e.stopPropagation(); setToast(null); }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6B6A65',
            padding: '0 0 0 8px',
            lineHeight: 1,
            fontSize: '18px',
          }}
        >
          ×
        </button>
      </div>
      {toast.body && (
        <span style={{ fontSize: '13px', color: '#6B6A65' }}>{toast.body}</span>
      )}
    </div>
  );
}
