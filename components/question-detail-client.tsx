'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateQuestion, completeRevision } from '@/app/actions';
import type { QuestionState } from '@/lib/question-state';

interface CompletedRevision {
  id: string;
  index: number;
  completed_at: string | null;
}

interface QuestionDetailClientProps {
  questionId: string;
  initialTitle: string;
  initialLinkUrl: string;
  initialDescription: string;
  state: QuestionState;
  nextRevisionId: string | null;
  completedRevisions: CompletedRevision[];
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
}: QuestionDetailClientProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialTitle);
  const [linkUrl, setLinkUrl] = useState(initialLinkUrl);
  const [description, setDescription] = useState(initialDescription);
  const [isDirty, setIsDirty] = useState(false);
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
            value={description}
            onChange={(e) => { setDescription(e.target.value); markDirty(); }}
            rows={3}
            className="w-full rounded-lg px-3 py-2 text-sm border resize-none"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: 'rgba(17,17,16,0.14)',
              color: '#111110',
              outline: 'none',
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

      {/* Revision history */}
      {completedRevisions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-2" style={{ color: '#6B6A65' }}>
            Revision history
          </h2>
          <div className="flex flex-col gap-1.5">
            {completedRevisions.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(17,17,16,0.08)',
                }}
              >
                <span className="text-sm" style={{ color: '#111110' }}>
                  Revision {r.index}
                </span>
                <span className="text-xs" style={{ color: '#9C9B95' }}>
                  {r.completed_at ? formatDateTime(r.completed_at) : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
