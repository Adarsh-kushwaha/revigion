import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/dashboard-client';

function pickAvatar(meta: Record<string, unknown> | undefined): string | null {
  if (!meta) return null;
  const v =
    (meta.avatar_url as string | undefined) ??
    (meta.picture as string | undefined) ??
    null;
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function pickName(meta: Record<string, unknown> | undefined): string {
  if (!meta) return '';
  const v =
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    '';
  return typeof v === 'string' ? v : '';
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name = pickName(meta);
  const avatarUrl = pickAvatar(meta);

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: '#FAFAF6' }}>
      <div className="w-full max-w-[430px] flex flex-col flex-1">
        <DashboardClient
          userId={user.id}
          name={name}
          email={user.email ?? ''}
          avatarUrl={avatarUrl}
        />
      </div>
    </div>
  );
}
