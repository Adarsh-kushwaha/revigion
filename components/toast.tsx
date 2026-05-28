'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type ToastKind = 'error' | 'info' | 'success';

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_STYLE: Record<ToastKind, { bg: string; fg: string; border: string }> = {
  error:   { bg: '#2a1410', fg: '#FFD9D2', border: 'rgba(255,180,170,0.25)' },
  info:    { bg: '#111110', fg: '#FAFAF6', border: 'rgba(250,250,246,0.18)' },
  success: { bg: '#0f2317', fg: '#C7F0D2', border: 'rgba(180,240,200,0.22)' },
};

const DURATION_MS = 3800;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none',
          zIndex: 10000,
          padding: '0 16px',
        }}
      >
        {toasts.map((t) => {
          const s = KIND_STYLE[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              style={{
                backgroundColor: s.bg,
                color: s.fg,
                border: `1px solid ${s.border}`,
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '13px',
                lineHeight: 1.4,
                maxWidth: '420px',
                width: '100%',
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                pointerEvents: 'auto',
                animation: 'toast-in 180ms ease-out',
              }}
            >
              {t.message}
            </div>
          );
        })}
      </div>
      <ToastKeyframes />
    </ToastContext.Provider>
  );
}

function ToastKeyframes() {
  useEffect(() => {
    if (document.getElementById('toast-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'toast-keyframes';
    style.textContent = `@keyframes toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`;
    document.head.appendChild(style);
  }, []);
  return null;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { show: () => {} };
  }
  return ctx;
}
