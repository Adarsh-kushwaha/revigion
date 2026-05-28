'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/modal';
import { QuestionCard } from '@/components/question-card';
import { AppHeader } from '@/components/app-header';
import { createQuestion, deleteQuestion } from '@/app/actions';
import { useToast } from '@/components/toast';
import type { QuestionState } from '@/lib/question-state';

export interface QuestionEntry {
  id: string;
  title: string;
  created_at: string;
  revisions: { index: number; due_date: string | null; completed_at: string | null }[];
  state: QuestionState;
}

interface SubjectDetailClientProps {
  subjectId: string;
  subjectName: string;
  initialQuestions: QuestionEntry[];
}

export function SubjectDetailClient({
  subjectId,
  subjectName,
  initialQuestions,
}: SubjectDetailClientProps) {
  const [questions, setQuestions] = useState<QuestionEntry[]>(initialQuestions);
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [description, setDescription] = useState('');
  const toast = useToast();

  const handleCreate = useCallback(async () => {
    const t = title.trim();
    if (!t) return;
    const link = linkUrl.trim();
    const desc = description.trim();
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const optimistic: QuestionEntry = {
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

    setQuestions((prev) => [optimistic, ...prev]);
    setTitle('');
    setLinkUrl('');
    setDescription('');
    setAddOpen(false);

    const result = await createQuestion(subjectId, t, link, desc);
    if ('error' in result) {
      setQuestions((prev) => prev.filter((q) => q.id !== tempId));
      toast.show(`Could not add question: ${result.error}`, 'error');
      return;
    }
    const realId = result.data.id;
    setQuestions((prev) => prev.map((q) => (q.id === tempId ? { ...q, id: realId } : q)));
  }, [title, linkUrl, description, subjectId, toast]);

  const handleDelete = useCallback(
    async (id: string) => {
      let snapshot: QuestionEntry[] = [];
      setQuestions((prev) => {
        snapshot = prev;
        return prev.filter((q) => q.id !== id);
      });
      const result = await deleteQuestion(id);
      if ('error' in result) {
        setQuestions(snapshot);
        toast.show(`Could not delete question: ${result.error}`, 'error');
      }
    },
    [toast],
  );

  return (
    <>
      <AppHeader
        left={
          <div className="flex items-center gap-1 -ml-1">
            <Link
              href="/"
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
            onClick={() => setAddOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ backgroundColor: '#111110', color: '#FFFFFF' }}
            aria-label="Add question"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        }
      />

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
    </>
  );
}
