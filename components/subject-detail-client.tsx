'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/modal';
import { QuestionCard } from '@/components/question-card';
import { AppHeader } from '@/components/app-header';
import {
  createQuestion,
  deleteQuestion,
  getSubjectDetailData,
  type SubjectDetailData,
  type SubjectQuestionEntry,
} from '@/app/actions';
import { useToast } from '@/components/toast';
import { cacheKeys, clearCache, invalidateAll, isHardReload, readCache, writeCache } from '@/lib/client-cache';

export type QuestionEntry = SubjectQuestionEntry;

interface SubjectDetailClientProps {
  userId: string;
  subjectId: string;
}

export function SubjectDetailClient({ userId, subjectId }: SubjectDetailClientProps) {
  const [data, setData] = useState<SubjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [description, setDescription] = useState('');
  const toast = useToast();

  const cacheKey = cacheKeys.subject(userId, subjectId);

  const fetchAndCache = useCallback(async () => {
    const result = await getSubjectDetailData(subjectId);
    if ('data' in result) {
      setData(result.data);
      writeCache(cacheKey, result.data);
    }
  }, [subjectId, cacheKey]);

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
    const cached = readCache<SubjectDetailData>(cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
      window.dispatchEvent(new Event('app-ready'));
    } else {
      fetchAndCache().finally(() => {
        setLoading(false);
        window.dispatchEvent(new Event('app-ready'));
      });
    }
  }, [cacheKey, fetchAndCache]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetchAndCache();
    } finally {
      setRefreshing(false);
    }
  }

  const handleCreate = useCallback(async () => {
    const t = title.trim();
    if (!t) return;
    const link = linkUrl.trim();
    const desc = description.trim();
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const optimistic: SubjectQuestionEntry = {
      id: tempId,
      title: t,
      created_at: now,
      revisions: [
        { index: 1, due_date: null, completed_at: now },
        { index: 2, due_date: null, completed_at: null },
        { index: 3, due_date: null, completed_at: null },
        { index: 4, due_date: null, completed_at: null },
        { index: 5, due_date: null, completed_at: null },
      ],
      state: 'Normal',
    };

    setData((prev) =>
      prev ? { ...prev, questions: [optimistic, ...prev.questions] } : prev,
    );
    setTitle('');
    setLinkUrl('');
    setDescription('');
    setAddOpen(false);

    const result = await createQuestion(subjectId, t, link, desc);
    if ('error' in result) {
      setData((prev) =>
        prev ? { ...prev, questions: prev.questions.filter((q) => q.id !== tempId) } : prev,
      );
      toast.show(`Could not add question: ${result.error}`, 'error');
      return;
    }
    const realId = result.data.id;
    setData((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        questions: prev.questions.map((q) => (q.id === tempId ? { ...q, id: realId } : q)),
      };
      return next;
    });
    invalidateAll();
    await fetchAndCache();
  }, [title, linkUrl, description, subjectId, toast, fetchAndCache]);

  const handleDelete = useCallback(
    async (id: string) => {
      let snapshot: SubjectQuestionEntry[] = [];
      setData((prev) => {
        if (!prev) return prev;
        snapshot = prev.questions;
        return { ...prev, questions: prev.questions.filter((q) => q.id !== id) };
      });
      const result = await deleteQuestion(id);
      if ('error' in result) {
        setData((prev) => (prev ? { ...prev, questions: snapshot } : prev));
        toast.show(`Could not delete question: ${result.error}`, 'error');
        return;
      }
      invalidateAll();
      await fetchAndCache();
    },
    [toast, fetchAndCache],
  );

  const questions = data?.questions ?? [];
  const subjectName = data?.subjectName ?? '';

  return (
    <>
      <AppHeader
        left={
          <div className="flex items-center gap-1 -ml-1">
            <Link
              href="/subjects"
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
          <div className="flex items-center gap-2">
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
            <button
              onClick={() => setAddOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ backgroundColor: '#111110', color: '#FFFFFF' }}
              aria-label="Add question"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        }
      />

      {loading ? (
        <SubjectShimmer />
      ) : (
        <>
          <div className="px-4 pt-5 pb-3">
            <h1 className="text-[28px] font-semibold leading-tight" style={{ color: '#111110' }}>
              {subjectName}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#6B6A65' }}>
              {questions.length} {questions.length === 1 ? 'question' : 'questions'}
            </p>
          </div>

          <main className="flex-1 flex flex-col px-4 pb-6 gap-2">
            {questions.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: '#9C9B95' }}>
                No questions yet. Tap + to add one.
              </p>
            ) : (
              questions.map((q) => (
                <QuestionCard
                  key={q.id}
                  id={q.id}
                  subjectId={subjectId}
                  title={q.title}
                  createdAt={q.created_at}
                  revisions={q.revisions.map((r) => ({ index: r.index, completed_at: r.completed_at }))}
                  state={q.state}
                  onDelete={handleDelete}
                />
              ))
            )}
          </main>
        </>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New question">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs block mb-1" style={{ color: '#6B6A65' }}>Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm border"
              style={{
                backgroundColor: '#FAFAF6',
                borderColor: 'rgba(17,17,16,0.14)',
                color: '#111110',
                outline: 'none',
              }}
              placeholder="What is the question about?"
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: '#6B6A65' }}>Link URL (optional)</label>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm border"
              style={{
                backgroundColor: '#FAFAF6',
                borderColor: 'rgba(17,17,16,0.14)',
                color: '#111110',
                outline: 'none',
              }}
              placeholder="https://..."
              type="url"
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: '#6B6A65' }}>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg px-3 py-2 text-sm border resize-none"
              style={{
                backgroundColor: '#FAFAF6',
                borderColor: 'rgba(17,17,16,0.14)',
                color: '#111110',
                outline: 'none',
              }}
              placeholder="Additional context..."
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="w-full rounded-lg py-2 text-sm font-medium mt-1"
            style={{
              backgroundColor: '#111110',
              color: '#FFFFFF',
              opacity: !title.trim() ? 0.5 : 1,
            }}
          >
            Create
          </button>
        </div>
      </Modal>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

function SubjectShimmer() {
  return (
    <>
      <div className="px-4 pt-5 pb-3">
        <div className="sk" style={{ width: '160px', height: '28px', borderRadius: '8px' }} />
        <div className="sk" style={{ width: '80px', height: '12px', marginTop: '8px' }} />
      </div>
      <main className="flex-1 flex flex-col px-4 pb-6 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl px-4 py-3"
            style={{ backgroundColor: 'transparent', border: '1px solid rgba(17,17,16,0.08)' }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="sk" style={{ width: '144px', height: '14px' }} />
                <div className="sk" style={{ width: '56px', height: '10px', marginTop: '6px' }} />
              </div>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4].map((j) => (
                  <div
                    key={j}
                    className="sk"
                    style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                  />
                ))}
                <div className="sk ml-1" style={{ width: '28px', height: '28px', borderRadius: '8px' }} />
              </div>
            </div>
          </div>
        ))}
      </main>
    </>
  );
}
