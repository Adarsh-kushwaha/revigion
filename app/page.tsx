import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HomeClient } from '@/components/home-client';
import { questionState } from '@/lib/question-state';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const timezone = 'Asia/Calcutta';
  const today = new Date();

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, description, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const subjectIds = subjects?.map((s) => s.id) ?? [];

  const { data: questions } = subjectIds.length
    ? await supabase
        .from('questions')
        .select('id, subject_id, revisions(index, due_date, completed_at)')
        .in('subject_id', subjectIds)
    : { data: [] };

  const subjectData = (subjects ?? []).map((subject) => {
    const qs = (questions ?? []).filter((q) => q.subject_id === subject.id);
    let dueCount = 0;
    let missedCount = 0;
    for (const q of qs) {
      const revs = (q.revisions ?? []) as {
        index: number;
        due_date: string | null;
        completed_at: string | null;
      }[];
      const state = questionState({ revisions: revs, today, userTimezone: timezone });
      if (state === 'DueToday') dueCount++;
      if (state === 'Missed') missedCount++;
    }
    return {
      id: subject.id,
      name: subject.name,
      description: subject.description ?? '',
      questionCount: qs.length,
      dueCount,
      missedCount,
    };
  });

  const totalActionable = subjectData.reduce((acc, s) => acc + s.dueCount + s.missedCount, 0);
  const dueLabel = totalActionable > 0 ? `${totalActionable} due today` : 'nothing due';

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: '#FAFAF6' }}>
      <div className="w-full max-w-[430px] flex flex-col flex-1">
        {/* The HomeClient renders the full page including header actions + list */}
        <HomeClient
          subjects={subjectData}
          email={user.email ?? ''}
          subjectCount={subjectData.length}
          dueLabel={dueLabel}
        />
      </div>
    </div>
  );
}
