'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import {
  completeRevision,
  getQuestionDetailData,
  updateQuestion,
  type QuestionDetailData,
} from '@/app/actions';
import { useToast } from '@/components/toast';
import { cacheKeys, clearCache, invalidateAll, isHardReload, readCache, writeCache } from '@/lib/client-cache';

interface QuestionDetailClientProps {
  userId: string;
  subjectId: string;
  questionId: string;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const COUNTDOWN_SECONDS = 5;

export function QuestionDetailClient({ userId, subjectId, questionId }: QuestionDetailClientProps) {
  const cacheKey = cacheKeys.question(userId, questionId);
  const [data, setData] = useState<QuestionDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const savedRef = useRef({ title: '', linkUrl: '', description: '' });
  const toast = useToast();

  const [revisionStarted, setRevisionStarted] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  // Derived, not stored: avoids a setState-in-effect cascade when the timer hits zero.
  const countdownDone = revisionStarted && countdown <= 0;

  const applyData = useCallback((d: QuestionDetailData) => {
    setData(d);
    setTitle(d.title);
    setLinkUrl(d.linkUrl);
    setDescription(d.description);
    savedRef.current = { title: d.title, linkUrl: d.linkUrl, description: d.description };
    setIsDirty(false);
  }, []);

  const fetchAndCache = useCallback(async () => {
    const result = await getQuestionDetailData(questionId);
    if ('data' in result) {
      applyData(result.data);
      writeCache(cacheKey, result.data);
    }
  }, [questionId, cacheKey, applyData]);

  useEffect(() => {
    if (isHardReload()) {
      clearCache(cacheKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAndCache().finally(() => {
        setLoading(false);
        window.dispatchEvent(new Event('app-ready'));
      });
      return;
    }
    const cached = readCache<QuestionDetailData>(cacheKey);
    if (cached) {
      applyData(cached);
      setLoading(false);
      window.dispatchEvent(new Event('app-ready'));
    } else {
      fetchAndCache().finally(() => {
        setLoading(false);
        window.dispatchEvent(new Event('app-ready'));
      });
    }
  }, [cacheKey, fetchAndCache, applyData]);

  useEffect(() => {
    if (!descRef.current) return;
    descRef.current.style.height = 'auto';
    descRef.current.style.height = descRef.current.scrollHeight + 'px';
  }, [description]);

  useEffect(() => {
    if (!revisionStarted || countdownDone) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [revisionStarted, countdownDone, countdown]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetchAndCache();
    } finally {
      setRefreshing(false);
    }
  }

  function markDirty() {
    setIsDirty(true);
  }

  function handleStartRevision() {
    setRevisionStarted(true);
    setCountdown(COUNTDOWN_SECONDS);
  }

  async function handleSave() {
    const snapshot = { ...savedRef.current };
    const next = { title, linkUrl, description };
    savedRef.current = next;
    setIsDirty(false);
    const result = await updateQuestion(questionId, next);
    if ('error' in result) {
      savedRef.current = snapshot;
      setTitle(snapshot.title);
      setLinkUrl(snapshot.linkUrl);
      setDescription(snapshot.description);
      setIsDirty(true);
      toast.show(`Could not save changes: ${result.error}`, 'error');
      return;
    }
    setData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, title: next.title, linkUrl: next.linkUrl, description: next.description };
      writeCache(cacheKey, updated);
      return updated;
    });
  }

  async function handleComplete() {
    const revisionId = data?.nextRevisionId;
    if (!revisionId) return;
    setRevisionStarted(false);
    const result = await completeRevision(revisionId);
    if ('error' in result) {
      toast.show(`Could not complete revision: ${result.error}`, 'error');
      return;
    }
    invalidateAll();
    await fetchAndCache();
  }

  const state = data?.state ?? 'Normal';
  const canStartRevision = state === 'DueToday' || state === 'Missed';
  const allRevisions = data?.allRevisions ?? [];
  const nextRevisionId = data?.nextRevisionId ?? null;

  return (
    <>
      <AppHeader
        left={
          <div className="flex items-center gap-1 -ml-1">
            <Link
              href={`/subjects/${subjectId}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ color: '#111110' }}
              aria-label="Back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </Link>
            <span
              className="text-sm font-medium"
              style={{ color: '#9C9B95', fontFamily: 'var(--font-geist-mono)' }}
            >
              revigion
            </span>
          </div>
        }
        right={
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{
              backgroundColor: 'transparent',
              color: '#9C9B95',
              border: '1px solid rgba(17,17,16,0.14)',
              opacity: refreshing || loading ? 0.5 : 1,
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
        }
      />

      <main className="flex-1 flex flex-col px-4 py-5 gap-5">
        {loading || !data ? (
          <QuestionShimmer />
        ) : (
          <>
            <p className="text-sm" style={{ color: '#6B6A65' }}>
              Completed {data.completedCount} / Remaining {data.remainingCount}
            </p>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#6B6A65' }}>Title</label>
                  <input
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); markDirty(); }}
                    className="w-full rounded-lg px-3 py-2 text-sm border"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: 'rgba(17,17,16,0.14)',
                      color: '#111110',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#6B6A65' }}>Link URL</label>
                  <input
                    value={linkUrl}
                    onChange={(e) => { setLinkUrl(e.target.value); markDirty(); }}
                    type="url"
                    className="w-full rounded-lg px-3 py-2 text-sm border"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: 'rgba(17,17,16,0.14)',
                      color: '#111110',
                      outline: 'none',
                    }}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#6B6A65' }}>Description</label>
                  <textarea
                    ref={descRef}
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); markDirty(); }}
                    rows={3}
                    className="w-full rounded-lg px-3 py-2 text-sm border resize-none overflow-hidden"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: 'rgba(17,17,16,0.14)',
                      color: '#111110',
                      outline: 'none',
                      minHeight: '80px',
                    }}
                    placeholder="Additional context..."
                  />
                </div>

                {isDirty && (
                  <button
                    onClick={handleSave}
                    className="w-full rounded-lg py-2 text-sm font-medium"
                    style={{ backgroundColor: '#111110', color: '#FFFFFF' }}
                  >
                    Save
                  </button>
                )}
              </div>

              {canStartRevision && (
                <div
                  className="rounded-xl p-4 flex flex-col gap-3"
                  style={{
                    backgroundColor: state === 'Missed' ? 'oklch(0.96 0.04 85)' : 'oklch(0.96 0.02 250)',
                    border: `1px solid ${state === 'Missed' ? 'oklch(0.86 0.07 80)' : 'oklch(0.86 0.04 250)'}`,
                  }}
                >
                  <p className="text-sm font-medium" style={{ color: '#111110' }}>
                    {state === 'Missed' ? 'Missed revision' : 'Revision due today'}
                  </p>

                  {!revisionStarted ? (
                    <button
                      onClick={handleStartRevision}
                      className="w-full rounded-lg py-2.5 text-sm font-medium"
                      style={{ backgroundColor: '#111110', color: '#FFFFFF' }}
                    >
                      Start Revision
                    </button>
                  ) : !countdownDone ? (
                    <button
                      disabled
                      className="w-full rounded-lg py-2.5 text-sm font-medium"
                      style={{ backgroundColor: '#111110', color: '#FFFFFF', opacity: 0.5 }}
                    >
                      Complete in {countdown}s…
                    </button>
                  ) : (
                    <button
                      onClick={handleComplete}
                      className="w-full rounded-lg py-2.5 text-sm font-medium"
                      style={{ backgroundColor: 'oklch(0.62 0.12 150)', color: '#FFFFFF' }}
                    >
                      Complete Revision
                    </button>
                  )}
                </div>
              )}

              {allRevisions.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#9C9B95', fontFamily: 'var(--font-geist-mono)' }}>
                    Revision Timeline
                  </h2>
                  <div className="relative">
                    <div
                      className="absolute top-2 bottom-2"
                      style={{
                        left: '7px',
                        width: '1px',
                        background: 'linear-gradient(to bottom, rgba(17,17,16,0.15), rgba(17,17,16,0.06))',
                      }}
                    />

                    <div className="flex flex-col">
                      {allRevisions.map((r, i) => {
                        const isDone = r.completed_at !== null;
                        const isLast = i === allRevisions.length - 1;
                        const isDueNow = !isDone && (state === 'DueToday' || state === 'Missed') && nextRevisionId === r.id;

                        return (
                          <div key={r.id} className="flex items-start gap-3.5" style={{ paddingBottom: isLast ? 0 : '20px' }}>
                            <div className="relative z-10 mt-0.5 flex-shrink-0 flex items-center justify-center" style={{ width: '14px', height: '14px' }}>
                              {isDone ? (
                                <div
                                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: '#111110' }}
                                >
                                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                                    <path d="M2 5l2.5 2.5L8 3" stroke="#FAFAF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                              ) : isDueNow ? (
                                <div
                                  className="w-3.5 h-3.5 rounded-full"
                                  style={{
                                    backgroundColor: state === 'Missed' ? 'oklch(0.72 0.15 50)' : 'oklch(0.55 0.14 250)',
                                    boxShadow: `0 0 0 3px ${state === 'Missed' ? 'oklch(0.92 0.06 80)' : 'oklch(0.9 0.05 250)'}`,
                                  }}
                                />
                              ) : (
                                <div
                                  className="w-3 h-3 rounded-full border-2"
                                  style={{
                                    borderColor: 'rgba(17,17,16,0.2)',
                                    backgroundColor: '#FAFAF6',
                                  }}
                                />
                              )}
                            </div>

                            <div className="flex-1 flex items-baseline justify-between min-w-0 -mt-0.5">
                              <span
                                className="text-sm font-medium"
                                style={{ color: isDone ? '#111110' : isDueNow ? '#111110' : '#C2C1BB' }}
                              >
                                Revision {r.index}
                              </span>
                              <span
                                className="text-xs ml-2 flex-shrink-0"
                                style={{
                                  color: isDone ? '#6B6A65' : isDueNow ? (state === 'Missed' ? 'oklch(0.55 0.12 50)' : 'oklch(0.45 0.1 250)') : '#C2C1BB',
                                  fontFamily: 'var(--font-geist-mono)',
                                }}
                              >
                                {isDone
                                  ? formatDateTime(r.completed_at!)
                                  : isDueNow
                                    ? state === 'Missed' ? 'Missed' : 'Due today'
                                    : r.due_date
                                      ? formatDateTime(r.due_date)
                                      : 'Upcoming'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

function QuestionShimmer() {
  return (
    <div className="flex flex-col gap-5">
      <div className="sk" style={{ width: '180px', height: '12px' }} />
      <div className="flex flex-col gap-3">
        <div>
          <div className="sk" style={{ width: '40px', height: '10px', marginBottom: '6px' }} />
          <div className="sk" style={{ width: '100%', height: '36px', borderRadius: '8px' }} />
        </div>
        <div>
          <div className="sk" style={{ width: '60px', height: '10px', marginBottom: '6px' }} />
          <div className="sk" style={{ width: '100%', height: '36px', borderRadius: '8px' }} />
        </div>
        <div>
          <div className="sk" style={{ width: '70px', height: '10px', marginBottom: '6px' }} />
          <div className="sk" style={{ width: '100%', height: '80px', borderRadius: '8px' }} />
        </div>
      </div>
      <div>
        <div className="sk" style={{ width: '140px', height: '10px', marginBottom: '16px' }} />
        <div className="flex flex-col gap-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3.5">
              <div className="sk" style={{ width: '14px', height: '14px', borderRadius: '50%' }} />
              <div className="flex-1 flex justify-between">
                <div className="sk" style={{ width: '80px', height: '12px' }} />
                <div className="sk" style={{ width: '60px', height: '10px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
