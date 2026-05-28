import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HomeClient } from '@/components/home-client';
import { getHomeData } from '@/app/actions';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const home = await getHomeData();
  const initialSubjects = 'data' in home ? home.data.subjects : [];

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: '#FAFAF6' }}>
      <div className="w-full max-w-[430px] flex flex-col flex-1">
        <HomeClient
          userId={user.id}
          email={user.email ?? ''}
          initialSubjects={initialSubjects}
        />
      </div>
    </div>
  );
}
