'use client';

import { useState, useTransition } from 'react';
import { Modal } from '@/components/modal';
import { createQuestion } from '@/app/actions';

interface SubjectQuestionsClientProps {
  subjectId: string;
}

export function SubjectQuestionsClient({ subjectId }: SubjectQuestionsClientProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleCreate() {
    if (!title.trim()) return;
    startTransition(async () => {
      await createQuestion(subjectId, title.trim(), linkUrl.trim(), description.trim());
      setTitle('');
      setLinkUrl('');
      setDescription('');
      setAddOpen(false);
    });
  }

  return (
    <>
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
            disabled={isPending || !title.trim()}
            className="w-full rounded-lg py-2 text-sm font-medium mt-1"
            style={{
              backgroundColor: '#111110',
              color: '#FFFFFF',
              opacity: isPending || !title.trim() ? 0.5 : 1,
            }}
          >
            {isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </Modal>
    </>
  );
}
