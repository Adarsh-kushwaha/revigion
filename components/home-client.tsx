'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { SubjectCard } from '@/components/subject-card';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { AppHeader } from '@/components/app-header';
import { createSubject, getHomeData } from '@/app/actions';
import type { SubjectData } from '@/app/actions';
import { requestAndRegisterToken } from '@/lib/fcm-token';

const CACHE_TTL = 24 * 60 * 60 * 1000;

interface CacheEntry {
  subjects: SubjectData[];
  fetchedAt: number;
}

function cacheKey(userId: string) {
  return `home-data-v1-${userId}`;
}

function readCache(userId: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.fetchedAt > CACHE_TTL) return null;
    return entry;
  } catch {
    return null;
  }
}

function writeCache(userId: string, subjects: SubjectData[]) {
  try {
    const entry: CacheEntry = { subjects, fetchedAt: Date.now() };
    localStorage.setItem(cacheKey(userId), JSON.stringify(entry));
  } catch {
    // storage full or unavailable — ignore
  }
}

function invalidateCache(userId: string) {
  try {
    localStorage.removeItem(cacheKey(userId));
  } catch {
    // ignore
  }
}

// ─── Notification Banner ─────────────────────────────────────────────────────

async function sendWelcomeNotification() {
  if (localStorage.getItem('welcome_notif_sent') === '1') return;
  localStorage.setItem('welcome_notif_sent', '1');
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification('Welcome to Revigion! 🎉', {
      body: "You're all set. We'll remind you when revisions are due.",
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    });
  } catch {
    new Notification('Welcome to Revigion! 🎉', {
      body: "You're all set. We'll remind you when revisions are due.",
      icon: '/icons/icon-192.png',
    });
  }
}

function NotificationBanner() {
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosPopover, setShowIosPopover] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissed = sessionStorage.getItem('notif_dismissed') === '1';
    const alreadyGranted = Notification.permission === 'granted';

    setVisible(!dismissed && !alreadyGranted && 'Notification' in window);

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
    const standalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
      || window.matchMedia('(display-mode: standalone)').matches;
    setIsIos(ios);
    setIsStandalone(standalone);

    function handleAppInstalled() {
      if (Notification.permission === 'granted') {
        sendWelcomeNotification();
      }
    }
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);

  useEffect(() => {
    if (!showIosPopover) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowIosPopover(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showIosPopover]);

  if (!visible) return null;

  function dismiss() {
    sessionStorage.setItem('notif_dismissed', '1');
    setVisible(false);
  }

  async function handleEnable() {
    setEnabling(true);
    try {
      const token = await requestAndRegisterToken();
      if (token || Notification.permission === 'granted') {
        setVisible(false);
        sendWelcomeNotification();
      }
    } finally {
      setEnabling(false);
    }
  }

  const showIosHint = isIos && !isStandalone;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(17,17,16,0.14)',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(17,17,16,0.08)',
        padding: '12px 14px',
        marginBottom: '4px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px', flexShrink: 0 }} aria-hidden="true">🔔</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#111110' }}>
              Enable notifications
            </span>
            <button
              onClick={handleEnable}
              disabled={enabling}
              style={{
                backgroundColor: '#111110',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '3px 10px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: enabling ? 'default' : 'pointer',
                opacity: enabling ? 0.6 : 1,
                flexShrink: 0,
              }}
            >
              {enabling ? 'Enabling…' : 'Enable'}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#6B6A65', margin: '2px 0 0 0' }}>
            Get reminders when revisions are due
          </p>
          {showIosHint && (
            <p style={{ fontSize: '12px', color: '#6B6A65', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              iOS Safari: Add to Home Screen first
              <span style={{ position: 'relative', display: 'inline-flex' }} ref={popoverRef}>
                <button
                  aria-label="iOS push notification help"
                  onClick={() => setShowIosPopover((v) => !v)}
                  style={{
                    background: 'rgba(17,17,16,0.08)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6B6A65',
                    flexShrink: 0,
                  }}
                >
                  ?
                </button>
                {showIosPopover && (
                  <div
                    role="tooltip"
                    style={{
                      position: 'absolute',
                      bottom: '22px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#111110',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '11px',
                      lineHeight: '1.4',
                      width: '200px',
                      zIndex: 100,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    }}
                  >
                    On iOS Safari, tap the Share button (⎋) then &ldquo;Add to Home Screen&rdquo;. Push notifications require the app to be installed.
                  </div>
                )}
              </span>
            </p>
          )}
        </div>

        <button
          aria-label="Dismiss notification banner"
          onClick={dismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6B6A65',
            fontSize: '18px',
            lineHeight: 1,
            padding: '0',
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface HomeClientProps {
  userId: string;
  email: string;
  initialSubjects?: SubjectData[];
}

export function HomeClient({ userId, email, initialSubjects }: HomeClientProps) {
  const [subjects, setSubjects] = useState<SubjectData[]>(initialSubjects ?? []);
  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [subjectDesc, setSubjectDesc] = useState('');
  const [createError, setCreateError] = useState('');
  const [isPending, startTransition] = useTransition();

  const fetchAndCache = useCallback(async () => {
    const result = await getHomeData();
    if ('data' in result) {
      setSubjects(result.data.subjects);
      writeCache(userId, result.data.subjects);
    }
    return result;
  }, [userId]);

  useEffect(() => {
    if (initialSubjects) {
      writeCache(userId, initialSubjects);
      window.dispatchEvent(new Event('app-ready'));
      return;
    }
    const cached = readCache(userId);
    if (cached) {
      setSubjects(cached.subjects);
      window.dispatchEvent(new Event('app-ready'));
    } else {
      fetchAndCache().then(() => {
        window.dispatchEvent(new Event('app-ready'));
      });
    }
  }, [userId, fetchAndCache, initialSubjects]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetchAndCache();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCreate() {
    if (!subjectName.trim()) return;
    setCreateError('');
    startTransition(async () => {
      const result = await createSubject(subjectName.trim(), subjectDesc.trim());
      if ('error' in result) {
        setCreateError(result.error);
        return;
      }
      setSubjectName('');
      setSubjectDesc('');
      setAddOpen(false);
      invalidateCache(userId);
      await fetchAndCache();
    });
  }

  const totalActionable = subjects.reduce((acc, s) => acc + s.dueCount + s.missedCount, 0);
  const dueLabel = totalActionable > 0 ? `${totalActionable} due today` : 'nothing due';

  return (
    <>
      <AppHeader
        left={
          <span
            className="text-sm font-medium"
            style={{ color: '#9C9B95', fontFamily: 'var(--font-geist-mono)' }}
          >
            revigion
          </span>
        }
        right={
          <>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{
                backgroundColor: 'transparent',
                color: '#9C9B95',
                border: '1px solid rgba(17,17,16,0.14)',
                opacity: refreshing ? 0.5 : 1,
              }}
              aria-label="Refresh"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ backgroundColor: '#111110', color: '#FFFFFF' }}
              aria-label="Add subject"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <ProfileDropdown email={email} />
          </>
        }
      />

      <main className="flex-1 flex flex-col px-4 py-5 gap-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight" style={{ color: '#111110' }}>
            Subjects
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B6A65' }}>
            {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'} · {dueLabel}
          </p>
        </div>

        <NotificationBanner />

        {subjects.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: '#9C9B95' }}>
            No subjects yet. Tap + to add one.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {subjects.map((s) => (
              <SubjectCard key={s.id} {...s} />
            ))}
          </div>
        )}
      </main>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New subject">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs block mb-1" style={{ color: '#6B6A65' }}>Name</label>
            <input
              autoFocus
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              className="w-full rounded-lg px-3 py-2 text-sm border"
              style={{
                backgroundColor: '#FAFAF6',
                borderColor: 'rgba(17,17,16,0.14)',
                color: '#111110',
                outline: 'none',
              }}
              placeholder="e.g. Linear Algebra"
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: '#6B6A65' }}>Description (optional)</label>
            <input
              value={subjectDesc}
              onChange={(e) => setSubjectDesc(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm border"
              style={{
                backgroundColor: '#FAFAF6',
                borderColor: 'rgba(17,17,16,0.14)',
                color: '#111110',
                outline: 'none',
              }}
              placeholder="Brief description"
            />
          </div>
          {createError && (
            <p className="text-xs rounded px-2 py-1" style={{ color: '#b91c1c', backgroundColor: '#fef2f2' }}>
              {createError}
            </p>
          )}
          <button
            onClick={handleCreate}
            disabled={isPending || !subjectName.trim()}
            className="w-full rounded-lg py-2 text-sm font-medium mt-1"
            style={{
              backgroundColor: '#111110',
              color: '#FFFFFF',
              opacity: isPending || !subjectName.trim() ? 0.5 : 1,
            }}
          >
            {isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </Modal>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
