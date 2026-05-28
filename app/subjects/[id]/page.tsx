import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { questionState } from '@/lib/question-state';
import { SubjectDetailClient, type QuestionEntry } from '@/components/subject-detail-client';

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

  const initialQuestions: QuestionEntry[] = (questions ?? []).map((q) => {
    const revs = (q.revisions ?? []) as {
      index: number;
      due_date: string | null;
      completed_at: string | null;
    }[];
    const state = questionState({ revisions: revs, today, userTimezone: timezone });
    return {
      id: q.id,
      title: q.title,
      created_at: q.created_at,
      revisions: revs,
      state,
    };
  });

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: '#FAFAF6' }}>
      <div className="w-full max-w-[430px] flex flex-col flex-1">
        <SubjectDetailClient
          subjectId={id}
          subjectName={subject.name}
          initialQuestions={initialQuestions}
        />
      </div>
    </div>
  );
}
