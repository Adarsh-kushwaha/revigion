'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/modal';
import { renameSubject, deleteSubject } from '@/app/actions';

interface SubjectCardProps {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  dueCount: number;
  missedCount: number;
}

export function SubjectCard({
  id,
  name,
  description,
  questionCount,
  dueCount,
  missedCount,
}: SubjectCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newName, setNewName] = useState(name);
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
    router.push(`/subjects/${id}`);
  }

  async function handleRename() {
    if (!newName.trim()) return;
    startTransition(async () => {
      await renameSubject(id, newName.trim());
      setRenameOpen(false);
    });
  }

  async function handleDelete() {
    startTransition(async () => {
      await deleteSubject(id);
      setDeleteOpen(false);
    });
  }

  return (
    <>
      <div
        onClick={handleCardClick}
        className="rounded-xl px-5 py-4 flex items-center justify-between cursor-pointer transition-all active:opacity-80 hover:shadow-md"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(17,17,16,0.08)',
          boxShadow: '0 2px 8px rgba(17,17,16,0.06), 0 1px 2px rgba(17,17,16,0.04)',
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: '#111110' }}>
            {name}
          </p>
          {description && (
            <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: '#6B6A65' }}>
              {description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs" style={{ color: '#9C9B95' }}>
              {questionCount} {questionCount === 1 ? 'question' : 'questions'}
            </span>
            {missedCount > 0 && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'oklch(0.78 0.12 80)' }}
                title="Missed revisions"
              />
            )}
            {dueCount > 0 && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'oklch(0.58 0.12 250)' }}
                title="Due today"
              />
            )}
          </div>
        </div>

        <div className="relative ml-2 flex-shrink-0" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ color: '#9C9B95' }}
            aria-label="More options"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="5" cy="12" r="1.6" fill="currentColor" />
              <circle cx="12" cy="12" r="1.6" fill="currentColor" />
              <circle cx="19" cy="12" r="1.6" fill="currentColor" />
            </svg>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-9 w-40 rounded-xl shadow-lg border z-10 overflow-hidden"
              style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(17,17,16,0.08)' }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setRenameOpen(true); }}
                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2"
                style={{ color: '#111110' }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F1')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H5a2 2 0 00-2 2v13a2 2 0 002 2h13a2 2 0 002-2v-6M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Rename
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

      <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title="Rename subject">
        <div className="flex flex-col gap-3">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
            className="w-full rounded-lg px-3 py-2 text-sm border"
            style={{
              backgroundColor: '#FAFAF6',
              borderColor: 'rgba(17,17,16,0.14)',
              color: '#111110',
              outline: 'none',
            }}
            placeholder="Subject name"
          />
          <button
            onClick={handleRename}
            disabled={isPending || !newName.trim()}
            className="w-full rounded-lg py-2 text-sm font-medium"
            style={{ backgroundColor: '#111110', color: '#FFFFFF', opacity: isPending ? 0.6 : 1 }}
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete subject">
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: '#6B6A65' }}>
            This will permanently delete <strong style={{ color: '#111110' }}>{name}</strong> and all its questions and revisions. This cannot be undone.
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
