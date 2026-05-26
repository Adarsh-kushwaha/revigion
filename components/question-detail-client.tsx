'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { updateQuestion, completeRevision } from '@/app/actions';
import type { QuestionState } from '@/lib/question-state';

interface Revision {
  id: string;
  index: number;
  due_date: string | null;
  completed_at: string | null;
}

interface QuestionDetailClientProps {
  questionId: string;
  initialTitle: string;
  initialLinkUrl: string;
  initialDescription: string;
  state: QuestionState;
  nextRevisionId: string | null;
  completedRevisions: Revision[];
  allRevisions: Revision[];
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const COUNTDOWN_SECONDS = 5;

export function QuestionDetailClient({
  questionId,
  initialTitle,
  initialLinkUrl,
  initialDescription,
  state,
  nextRevisionId,
  completedRevisions,
  allRevisions,
}: QuestionDetailClientProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialTitle);
  const [linkUrl, setLinkUrl] = useState(initialLinkUrl);
  const [description, setDescription] = useState(initialDescription);
  const [isDirty, setIsDirty] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!descRef.current) return;
    descRef.current.style.height = 'auto';
    descRef.current.style.height = descRef.current.scrollHeight + 'px';
  }, [description]);
  const [isSaving, startSavingTransition] = useTransition();
  const [isCompleting, startCompleteTransition] = useTransition();

  const [revisionStarted, setRevisionStarted] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [countdownDone, setCountdownDone] = useState(false);

  function markDirty() {
    setIsDirty(true);
  }

  useEffect(() => {
    if (!revisionStarted || countdownDone) return;
    if (countdown <= 0) {
      setCountdownDone(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [revisionStarted, countdown, countdownDone]);

  function handleStartRevision() {
    setRevisionStarted(true);
    setCountdown(COUNTDOWN_SECONDS);
    setCountdownDone(false);
  }

  async function handleSave() {
    startSavingTransition(async () => {
      await updateQuestion(questionId, {
        title,
        linkUrl,
        description,
      });
      setIsDirty(false);
    });
  }

  async function handleComplete() {
    if (!nextRevisionId) return;
    startCompleteTransition(async () => {
      await completeRevision(nextRevisionId);
      setRevisionStarted(false);
      setCountdownDone(false);
      router.refresh();
    });
  }

  const canStartRevision = state === 'DueToday' || state === 'Missed';

  return (
    <div className="flex flex-col gap-5">
      {/* Editable fields */}
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
            disabled={isSaving}
            className="w-full rounded-lg py-2 text-sm font-medium"
            style={{
              backgroundColor: '#111110',
              color: '#FFFFFF',
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        )}
      </div>

      {/* Revision action */}
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
              disabled={isCompleting}
              className="w-full rounded-lg py-2.5 text-sm font-medium"
              style={{
                backgroundColor: 'oklch(0.62 0.12 150)',
                color: '#FFFFFF',
                opacity: isCompleting ? 0.6 : 1,
              }}
            >
              {isCompleting ? 'Completing…' : 'Complete Revision'}
            </button>
          )}
        </div>
      )}

      {/* Revision timeline */}
      {allRevisions.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#9C9B95', fontFamily: 'var(--font-geist-mono)' }}>
            Revision Timeline
          </h2>
          <div className="relative pl-1">
            {/* vertical spine */}
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
                    {/* node */}
                    <div className="relative z-10 mt-0.5 flex-shrink-0 flex items-center justify-center" style={{ width: '15px', height: '15px' }}>
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

                    {/* content */}
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
  );
}
