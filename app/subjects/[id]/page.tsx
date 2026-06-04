import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SubjectDetailClient } from '@/components/subject-detail-client';

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

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: '#FAFAF6' }}>
      <div className="w-full max-w-[430px] flex flex-col flex-1">
        <SubjectDetailClient userId={user.id} subjectId={id} />
      </div>
    </div>
  );
}
