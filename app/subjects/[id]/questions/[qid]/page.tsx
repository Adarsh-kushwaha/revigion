import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { QuestionDetailClient } from '@/components/question-detail-client';

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

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: '#FAFAF6' }}>
      <div className="w-full max-w-[430px] flex flex-col flex-1">
        <QuestionDetailClient userId={user.id} subjectId={id} questionId={qid} />
      </div>
    </div>
  );
}
