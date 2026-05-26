'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/modal';
import { deleteQuestion } from '@/app/actions';
import type { QuestionState } from '@/lib/question-state';

interface Revision {
  index: number;
  completed_at: string | null;
}

interface QuestionCardProps {
  id: string;
  subjectId: string;
  title: string;
  createdAt: string;
  revisions: Revision[];
  state: QuestionState;
}

const stateStyles: Record<QuestionState, { bg: string; border: string }> = {
  Completed: { bg: 'oklch(0.95 0.03 150)', border: 'oklch(0.84 0.05 150)' },
  Missed: { bg: 'oklch(0.96 0.04 85)', border: 'oklch(0.86 0.07 80)' },
  DueToday: { bg: 'oklch(0.96 0.02 250)', border: 'oklch(0.86 0.04 250)' },
  Normal: { bg: 'transparent', border: 'rgba(17,17,16,0.08)' },
};

const circleColor: Record<QuestionState, string> = {
  Completed: 'oklch(0.62 0.12 150)',
  Missed: 'oklch(0.78 0.12 80)',
  DueToday: 'oklch(0.58 0.12 250)',
  Normal: '#111110',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function QuestionCard({
  id,
  subjectId,
  title,
  createdAt,
  revisions,
  state,
}: QuestionCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleCardClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (menuRef.current?.contains(target)) return;
    router.push(`/subjects/${subjectId}/questions/${id}`);
  }

  async function handleDelete() {
    startTransition(async () => {
      await deleteQuestion(id);
      setDeleteOpen(false);
    });
  }

  const trimTitle = title.length > 20 ? title.slice(0, 20) + '…' : title;
  const { bg, border } = stateStyles[state];
  const color = circleColor[state];

  return (
    <>
      <div
        onClick={handleCardClick}
        className="rounded-xl px-4 py-3 cursor-pointer transition-opacity active:opacity-80"
        style={{ backgroundColor: bg, border: `1px solid ${border}` }}
      >
        {state === 'Missed' && (
          <div className="flex gap-2 mb-2 p-2 rounded-lg" style={{ backgroundColor: 'oklch(0.96 0.04 85)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="oklch(0.78 0.12 80)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <path d="M12 9v4M12 17h.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.7 3.86a2 2 0 00-3.4 0z" />
            </svg>
            <p className="text-xs leading-snug" style={{ color: 'oklch(0.55 0.10 70)' }}>
              You missed the revision. Complete it now, otherwise the next revision cycle will never start and you may forget this question.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: '#111110' }}>
              {trimTitle}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9C9B95' }}>
              {formatDate(createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((idx) => {
              const rev = revisions.find((r) => r.index === idx);
              const done = !!rev?.completed_at;
              return (
                <div
                  key={idx}
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: done ? color : 'transparent',
                    border: done ? 'none' : '1.5px solid rgba(17,17,16,0.14)',
                  }}
                >
                  {done && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l4.5 4.5L19 7" />
                    </svg>
                  )}
                </div>
              );
            })}

            <div className="relative ml-1" ref={menuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg"
                style={{ color: '#9C9B95' }}
                aria-label="More options"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="5" cy="12" r="1.6" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.6" fill="currentColor" />
                  <circle cx="19" cy="12" r="1.6" fill="currentColor" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-8 w-36 rounded-xl shadow-lg border z-10 overflow-hidden"
                  style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(17,17,16,0.08)' }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      router.push(`/subjects/${subjectId}/questions/${id}`);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2"
                    style={{ color: '#111110' }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F1')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H5a2 2 0 00-2 2v13a2 2 0 002 2h13a2 2 0 002-2v-6M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setDeleteOpen(true); }}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2"
                    style={{ color: 'oklch(0.577 0.245 27.325)' }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#FFF5F5')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete question">
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: '#6B6A65' }}>
            This will permanently delete this question and all its revisions. This cannot be undone.
          </p>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="w-full rounded-lg py-2 text-sm font-medium"
            style={{ backgroundColor: 'oklch(0.577 0.245 27.325)', color: '#FFFFFF', opacity: isPending ? 0.6 : 1 }}
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </button>
          <button
            onClick={() => setDeleteOpen(false)}
            className="w-full rounded-lg py-2 text-sm"
            style={{ color: '#6B6A65' }}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </>
  );
}
