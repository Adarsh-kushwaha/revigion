import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { questionState } from '@/lib/question-state';
import { QuestionCard } from '@/components/question-card';
import { SubjectQuestionsClient } from '@/components/subject-questions-client';
import { AppHeader } from '@/components/app-header';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SubjectPage({ params }: PageProps) {
  const { id } = await params;

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

  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (subjectError || !subject) notFound();

  const { data: questions } = await supabase
    .from('questions')
    .select('id, title, created_at, revisions(index, due_date, completed_at)')
    .eq('subject_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const questionsWithState = (questions ?? []).map((q) => {
    const revs = (q.revisions ?? []) as {
      index: number;
      due_date: string | null;
      completed_at: string | null;
    }[];
    const state = questionState({ revisions: revs, today, userTimezone: timezone });
    return { ...q, revisions: revs, state };
  });

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: '#FAFAF6' }}>
      <div className="w-full max-w-[430px] flex flex-col flex-1">
        {/* TopBar */}
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
          right={<SubjectQuestionsClient subjectId={id} />}
        />

        {/* Title section */}
        <div className="px-4 pt-5 pb-3">
          <h1 className="text-[28px] font-semibold leading-tight" style={{ color: '#111110' }}>
            {subject.name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B6A65' }}>
            {questionsWithState.length} {questionsWithState.length === 1 ? 'question' : 'questions'}
          </p>
        </div>

        {/* Question list */}
        <main className="flex-1 flex flex-col px-4 pb-6 gap-2">
          {questionsWithState.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#9C9B95' }}>
              No questions yet. Tap + to add one.
            </p>
          ) : (
            questionsWithState.map((q) => (
              <QuestionCard
                key={q.id}
                id={q.id}
                subjectId={id}
                title={q.title}
                createdAt={q.created_at}
                revisions={q.revisions}
                state={q.state}
              />
            ))
          )}
        </main>
      </div>
    </div>
  );
}
