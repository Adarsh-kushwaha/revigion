import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { questionState } from '@/lib/question-state';
import { QuestionDetailClient } from '@/components/question-detail-client';
import { AppHeader } from '@/components/app-header';

interface PageProps {
  params: Promise<{ id: string; qid: string }>;
}

export default async function QuestionPage({ params }: PageProps) {
  const { id, qid } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .single();

  const timezone = profile?.timezone ?? 'Asia/Calcutta';
  const today = new Date();

  const { data: question, error: qError } = await supabase
    .from('questions')
    .select('id, title, link_url, description, created_at, subject_id')
    .eq('id', qid)
    .eq('user_id', user.id)
    .single();

  if (qError || !question) notFound();

  const { data: subject } = await supabase
    .from('subjects')
    .select('name')
    .eq('id', question.subject_id)
    .single();

  const { data: revisions } = await supabase
    .from('revisions')
    .select('id, index, due_date, completed_at')
    .eq('question_id', qid)
    .order('index', { ascending: true });

  const revs = (revisions ?? []) as {
    id: string;
    index: number;
    due_date: string | null;
    completed_at: string | null;
  }[];

  const state = questionState({ revisions: revs, today, userTimezone: timezone });

  const completedCount = revs.filter((r) => r.completed_at !== null).length;
  const remainingCount = 5 - completedCount;

  const nextPendingRevision = revs
    .filter((r) => r.completed_at === null && r.due_date !== null)
    .sort((a, b) => a.index - b.index)[0];

  const completedRevisions = revs
    .filter((r) => r.completed_at !== null)
    .sort((a, b) => a.index - b.index);

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: '#FAFAF6' }}>
      <div className="w-full max-w-[430px] flex flex-col flex-1">
        {/* TopBar */}
        <AppHeader
          left={
            <div className="flex items-center gap-1 -ml-1">
              <Link
                href={`/subjects/${id}`}
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
        />

        {/* Content */}
        <main className="flex-1 flex flex-col px-4 py-5 gap-5">
          {/* Info row */}
          <p className="text-sm" style={{ color: '#6B6A65' }}>
            Completed {completedCount} / Remaining {remainingCount}
          </p>

          <QuestionDetailClient
            questionId={qid}
            initialTitle={question.title}
            initialLinkUrl={question.link_url ?? ''}
            initialDescription={question.description ?? ''}
            state={state}
            nextRevisionId={nextPendingRevision?.id ?? null}
            completedRevisions={completedRevisions}
          />
        </main>
      </div>
    </div>
  );
}
