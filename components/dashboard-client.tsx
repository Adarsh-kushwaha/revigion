'use client';

import { useEffect, useState, useCallback } from 'react';
import { AppHeader } from '@/components/app-header';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { WelcomeCard } from '@/components/welcome-card';
import { StatCard } from '@/components/stat-card';
import { StreakCard } from '@/components/streak-card';
import { getDashboardData, type DashboardData } from '@/app/actions';
import { cacheKeys, isHardReload, readCache, writeCache, clearCache } from '@/lib/client-cache';

interface DashboardClientProps {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

const SubjectsIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16M4 12h16M4 18h10" />
  </svg>
);
const QuestionsIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" />
    <path d="M12 17h.01" />
  </svg>
);
const UpcomingIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const MissedIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
  </svg>
);

function greetingFor(timezone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: timezone,
    }).format(new Date()),
  );
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardClient({ userId, name, email, avatarUrl }: DashboardClientProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAndCache = useCallback(async () => {
    const result = await getDashboardData();
    if ('data' in result) {
      setData(result.data);
      writeCache(cacheKeys.dashboard(userId), result.data);
    }
  }, [userId]);

  useEffect(() => {
    const key = cacheKeys.dashboard(userId);
    if (isHardReload()) {
      clearCache(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAndCache().finally(() => {
        setLoading(false);
        window.dispatchEvent(new Event('app-ready'));
      });
      return;
    }
    const cached = readCache<DashboardData>(key);
    if (cached) {
      setData(cached);
      setLoading(false);
      window.dispatchEvent(new Event('app-ready'));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAndCache().finally(() => {
        setLoading(false);
        window.dispatchEvent(new Event('app-ready'));
      });
    }
  }, [userId, fetchAndCache]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetchAndCache();
    } finally {
      setRefreshing(false);
    }
  }

  const timezone = data?.userTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const greeting = greetingFor(timezone);

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
            <ProfileDropdown email={email} />
          </>
        }
      />

      <main
        className="flex-1 flex flex-col px-4 py-3"
        style={{ gap: '12px' }}
      >
        <WelcomeCard name={name} email={email} avatarUrl={avatarUrl} greeting={greeting} />

        {loading || !data ? (
          <DashboardShimmer />
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              <StatCard label="Subjects" value={data.subjectsCount} icon={SubjectsIcon} accent="default" />
              <StatCard label="Questions" value={data.questionsCount} icon={QuestionsIcon} accent="default" />
              <StatCard
                label="Upcoming"
                value={data.upcomingCount}
                icon={UpcomingIcon}
                accent={data.upcomingCount > 0 ? 'info' : 'default'}
              />
              <StatCard
                label="Missed"
                value={data.missedCount}
                icon={MissedIcon}
                accent={data.missedCount > 0 ? 'warning' : 'default'}
              />
            </div>

            <StreakCard
              heatmap={data.heatmap}
              currentStreak={data.currentStreak}
              longestStreak={data.longestStreak}
            />
          </>
        )}
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

function DashboardShimmer() {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(17,17,16,0.08)',
              padding: '12px',
              height: '72px',
            }}
          >
            <div className="sk" style={{ width: '60px', height: '10px' }} />
            <div className="sk" style={{ width: '40px', height: '20px', marginTop: '10px' }} />
          </div>
        ))}
      </div>
      <div
        className="rounded-xl"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(17,17,16,0.08)',
          padding: '16px',
          height: '180px',
        }}
      >
        <div className="sk" style={{ width: '120px', height: '12px' }} />
        <div className="sk" style={{ width: '100%', height: '120px', marginTop: '14px', borderRadius: '8px' }} />
      </div>
    </>
  );
}
