'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast';

interface SettingsClientProps {
  email: string;
}

export function SettingsClient({ email }: SettingsClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [signingOut, startSignOut] = useTransition();
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    window.dispatchEvent(new Event('app-ready'));
  }, []);

  function handleSignOut() {
    startSignOut(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    });
  }

  async function handleTestNotification() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.show('Notifications not supported on this device', 'error');
      return;
    }
    setTesting(true);
    try {
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      if (permission !== 'granted') {
        toast.show('Notification permission denied', 'error');
        return;
      }

      const body = `Test fired at ${new Date().toLocaleTimeString()}`;
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification('Revigion test 🔔', {
          body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: 'revigion-test',
        });
      } catch {
        new Notification('Revigion test 🔔', { body, icon: '/icons/icon-192.png' });
      }
      toast.show('Test notification sent', 'success');
    } catch {
      toast.show('Could not send test notification', 'error');
    } finally {
      setTesting(false);
    }
  }

  return (
    <>
      <AppHeader
        left={
          <span
            className="text-sm font-medium"
            style={{ color: '#9C9B95', fontFamily: 'var(--font-geist-mono)' }}
          >
            settings
          </span>
        }
      />

      <main className="flex-1 flex flex-col px-4 py-4" style={{ gap: '14px' }}>
        <div>
          <h1 className="text-[22px] font-bold leading-tight" style={{ color: '#111110' }}>
            Settings
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: '#6B6A65' }}>
            {email}
          </p>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(17,17,16,0.08)',
            boxShadow: '0 1px 2px rgba(17,17,16,0.04)',
          }}
        >
          <SettingRow
            icon={<MoonIcon />}
            title="Dark mode"
            description="Coming soon"
            disabled
            right={<Toggle checked={false} disabled />}
          />

          <Divider />

          <SettingRow
            icon={<BellIcon />}
            title="Test notification"
            description="Send a test push to this device"
            right={
              <button
                onClick={handleTestNotification}
                disabled={testing}
                className="rounded-lg text-[13px] font-semibold"
                style={{
                  backgroundColor: '#111110',
                  color: '#FFFFFF',
                  padding: '8px 14px',
                  opacity: testing ? 0.6 : 1,
                }}
              >
                {testing ? 'Sending…' : 'Send'}
              </button>
            }
          />

          <Divider />

          <SettingRow
            icon={<LogoutIcon />}
            title="Log out"
            description="Sign out of this device"
            right={
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="rounded-lg text-[13px] font-semibold"
                style={{
                  backgroundColor: 'transparent',
                  color: '#B91C1C',
                  border: '1px solid rgba(185,28,28,0.30)',
                  padding: '8px 14px',
                  opacity: signingOut ? 0.6 : 1,
                }}
              >
                {signingOut ? 'Signing out…' : 'Log out'}
              </button>
            }
          />
        </div>
      </main>
    </>
  );
}

function SettingRow({
  icon,
  title,
  description,
  right,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  right: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3"
      style={{ padding: '14px 16px', opacity: disabled ? 0.5 : 1 }}
      aria-disabled={disabled || undefined}
    >
      <span
        className="flex items-center justify-center rounded-lg flex-shrink-0"
        style={{
          width: '36px',
          height: '36px',
          backgroundColor: 'rgba(17,17,16,0.06)',
          color: '#111110',
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold" style={{ color: '#111110' }}>
          {title}
        </p>
        <p className="text-[12px] mt-0.5" style={{ color: '#6B6A65' }}>
          {description}
        </p>
      </div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: '1px', backgroundColor: 'rgba(17,17,16,0.06)', marginLeft: '64px' }} />;
}

function Toggle({ checked, disabled = false }: { checked: boolean; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      style={{
        width: '44px',
        height: '26px',
        borderRadius: '999px',
        backgroundColor: checked ? '#111110' : 'rgba(17,17,16,0.18)',
        position: 'relative',
        transition: 'background-color 150ms ease',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '21px' : '3px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.20)',
          transition: 'left 150ms ease',
        }}
      />
    </button>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
