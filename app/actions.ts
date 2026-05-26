'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { nextDueDate } from '@/lib/scheduler';

type AuthResult =
  | { ok: false; error: string }
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; user: NonNullable<Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>['auth']['getUser']>>['data']['user']> };

async function getSupabaseAndUser(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { ok: false, error: 'Not authenticated' };
  // Ensure profile row exists (handles users who signed up before trigger was installed)
  await supabase.from('profiles').upsert({ id: user.id, timezone: 'Asia/Calcutta' }, { onConflict: 'id', ignoreDuplicates: true });
  return { ok: true, supabase, user };
}

export async function createSubject(
  name: string,
  description: string,
): Promise<{ error: string } | { data: { id: string } }> {
  const result = await getSupabaseAndUser();
  if (!result.ok) return { error: result.error };
  const { supabase, user } = result;

  const { data, error } = await supabase
    .from('subjects')
    .insert({ user_id: user.id, name, description })
    .select('id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/');
  return { data };
}

export async function renameSubject(
  id: string,
  name: string,
): Promise<{ error: string } | { data: null }> {
  const result = await getSupabaseAndUser();
  if (!result.ok) return { error: result.error };
  const { supabase } = result;

  const { error } = await supabase
    .from('subjects')
    .update({ name })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/');
  revalidatePath('/subjects/[id]', 'page');
  return { data: null };
}

export async function deleteSubject(
  id: string,
): Promise<{ error: string } | { data: null }> {
  const result = await getSupabaseAndUser();
  if (!result.ok) return { error: result.error };
  const { supabase } = result;

  const { error } = await supabase.from('subjects').delete().eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/');
  return { data: null };
}

export async function createQuestion(
  subjectId: string,
  title: string,
  linkUrl: string,
  description: string,
): Promise<{ error: string } | { data: { id: string } }> {
  const result = await getSupabaseAndUser();
  if (!result.ok) return { error: result.error };
  const { supabase, user } = result;

  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .single();

  const userTimezone = profile?.timezone ?? 'Asia/Calcutta';
  const now = new Date();

  const { data: question, error: qError } = await supabase
    .from('questions')
    .insert({
      subject_id: subjectId,
      user_id: user.id,
      title,
      link_url: linkUrl,
      description,
    })
    .select('id')
    .single();

  if (qError) return { error: qError.message };

  const r2Due = nextDueDate({ lastCompletedAt: now, nextIndex: 2, userTimezone });
  const r2DueStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(r2Due);

  const revisions = [
    { question_id: question.id, user_id: user.id, index: 1, due_date: null, completed_at: now.toISOString() },
    { question_id: question.id, user_id: user.id, index: 2, due_date: r2DueStr, completed_at: null },
    { question_id: question.id, user_id: user.id, index: 3, due_date: null, completed_at: null },
    { question_id: question.id, user_id: user.id, index: 4, due_date: null, completed_at: null },
    { question_id: question.id, user_id: user.id, index: 5, due_date: null, completed_at: null },
  ];

  const { error: rError } = await supabase.from('revisions').insert(revisions);
  if (rError) return { error: rError.message };

  revalidatePath('/');
  revalidatePath('/subjects/[id]', 'page');
  return { data: { id: question.id } };
}

export async function updateQuestion(
  id: string,
  fields: { title?: string; linkUrl?: string; description?: string },
): Promise<{ error: string } | { data: null }> {
  const result = await getSupabaseAndUser();
  if (!result.ok) return { error: result.error };
  const { supabase } = result;

  const updates: Record<string, string> = {};
  if (fields.title !== undefined) updates.title = fields.title;
  if (fields.linkUrl !== undefined) updates.link_url = fields.linkUrl;
  if (fields.description !== undefined) updates.description = fields.description;

  const { error } = await supabase.from('questions').update(updates).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/subjects/[id]/questions/[qid]', 'page');
  return { data: null };
}

export async function deleteQuestion(
  id: string,
): Promise<{ error: string } | { data: null }> {
  const result = await getSupabaseAndUser();
  if (!result.ok) return { error: result.error };
  const { supabase } = result;

  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/subjects/[id]', 'page');
  return { data: null };
}

export async function registerFcmToken(
  token: string,
): Promise<{ error: string } | { data: null }> {
  const result = await getSupabaseAndUser();
  if (!result.ok) return { error: result.error };
  const { supabase, user } = result;

  const { error } = await supabase.from('fcm_tokens').upsert(
    { user_id: user.id, token, last_seen: new Date().toISOString() },
    { onConflict: 'token' },
  );

  if (error) return { error: error.message };
  return { data: null };
}

export async function pruneFcmToken(token: string): Promise<void> {
  const result = await getSupabaseAndUser();
  if (!result.ok) return;
  const { supabase } = result;

  await supabase.from('fcm_tokens').delete().eq('token', token);
}

export async function completeRevision(
  revisionId: string,
): Promise<{ error: string } | { data: null }> {
  const result = await getSupabaseAndUser();
  if (!result.ok) return { error: result.error };
  const { supabase, user } = result;

  const now = new Date();

  const { data: revision, error: fetchError } = await supabase
    .from('revisions')
    .select('id, index, question_id')
    .eq('id', revisionId)
    .single();

  if (fetchError || !revision) return { error: fetchError?.message ?? 'Revision not found' };

  const { error: updateError } = await supabase
    .from('revisions')
    .update({ completed_at: now.toISOString() })
    .eq('id', revisionId);

  if (updateError) return { error: updateError.message };

  if (revision.index < 5) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single();

    const userTimezone = profile?.timezone ?? 'Asia/Calcutta';
    const nextIndex = (revision.index + 1) as 2 | 3 | 4 | 5;
    const dueDate = nextDueDate({ lastCompletedAt: now, nextIndex, userTimezone });
    const dueDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(dueDate);

    const { error: nextError } = await supabase
      .from('revisions')
      .update({ due_date: dueDateStr })
      .eq('question_id', revision.question_id)
      .eq('index', nextIndex);

    if (nextError) return { error: nextError.message };
  }

  revalidatePath('/subjects/[id]/questions/[qid]', 'page');
  revalidatePath('/subjects/[id]', 'page');
  revalidatePath('/');
  return { data: null };
}
