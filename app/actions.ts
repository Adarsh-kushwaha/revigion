'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { nextDueDate } from '@/lib/scheduler';
import { questionState, type QuestionState } from '@/lib/question-state';
import { buildHeatmap, type HeatmapDay } from '@/lib/streak';

export interface SubjectData {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  dueCount: number;
  missedCount: number;
}

export interface HomeData {
  subjects: SubjectData[];
  email: string;
}

export async function getHomeData(): Promise<{ error: string } | { data: HomeData }> {
  const result = await getSupabaseAndUser();
  if (!result.ok) return { error: result.error };
  const { supabase, user } = result;

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
      const revs = (q.revisions ?? []) as { index: number; due_date: string | null; completed_at: string | null }[];
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

  return { data: { subjects: subjectData, email: user.email ?? '' } };
}

export interface DashboardData {
  subjectsCount: number;
  questionsCount: number;
  upcomingCount: number;
  missedCount: number;
  heatmap: HeatmapDay[];
  currentStreak: number;
  longestStreak: number;
  userTimezone: string;
  todayYmd: string;
}

export async function getDashboardData(): Promise<{ error: string } | { data: DashboardData }> {
  const result = await getSupabaseAndUser();
  if (!result.ok) return { error: result.error };
  const { supabase, user } = result;

  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .single();

  const userTimezone = profile?.timezone ?? 'Asia/Calcutta';
  const todayYmd = new Intl.DateTimeFormat('en-CA', { timeZone: userTimezone }).format(new Date());

  const [subjectsRes, questionsRes, revsRes] = await Promise.all([
    supabase
      .from('subjects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('revisions')
      .select('due_date, completed_at')
      .eq('user_id', user.id),
  ]);

  let upcomingCount = 0;
  let missedCount = 0;
  const completedIso: string[] = [];

  for (const r of (revsRes.data ?? []) as { due_date: string | null; completed_at: string | null }[]) {
    if (r.completed_at) {
      completedIso.push(r.completed_at);
    } else if (r.due_date) {
      if (r.due_date < todayYmd) missedCount++;
      else upcomingCount++;
    }
  }

  const { heatmap, currentStreak, longestStreak } = buildHeatmap(completedIso, userTimezone, 24);

  return {
    data: {
      subjectsCount: subjectsRes.count ?? 0,
      questionsCount: questionsRes.count ?? 0,
      upcomingCount,
      missedCount,
      heatmap,
      currentStreak,
      longestStreak,
      userTimezone,
      todayYmd,
    },
  };
}

export interface SubjectQuestionEntry {
  id: string;
  title: string;
  created_at: string;
  revisions: { index: number; due_date: string | null; completed_at: string | null }[];
  state: QuestionState;
}

export interface SubjectDetailData {
  subjectId: string;
  subjectName: string;
  questions: SubjectQuestionEntry[];
}

export async function getSubjectDetailData(
  id: string,
): Promise<{ error: string } | { data: SubjectDetailData }> {
  const result = await getSupabaseAndUser();
  if (!result.ok) return { error: result.error };
  const { supabase, user } = result;

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

  if (subjectError || !subject) return { error: 'Subject not found' };

  const { data: questions } = await supabase
    .from('questions')
    .select('id, title, created_at, revisions(index, due_date, completed_at)')
    .eq('subject_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const mapped: SubjectQuestionEntry[] = (questions ?? []).map((q) => {
    const revs = (q.revisions ?? []) as {
      index: number;
      due_date: string | null;
      completed_at: string | null;
    }[];
    const state = questionState({ revisions: revs, today, userTimezone: timezone });
    return { id: q.id, title: q.title, created_at: q.created_at, revisions: revs, state };
  });

  return { data: { subjectId: subject.id, subjectName: subject.name, questions: mapped } };
}

export interface QuestionRevisionEntry {
  id: string;
  index: number;
  due_date: string | null;
  completed_at: string | null;
}

export interface QuestionDetailData {
  questionId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  linkUrl: string;
  description: string;
  state: QuestionState;
  nextRevisionId: string | null;
  completedCount: number;
  remainingCount: number;
  completedRevisions: QuestionRevisionEntry[];
  allRevisions: QuestionRevisionEntry[];
}

export async function getQuestionDetailData(
  qid: string,
): Promise<{ error: string } | { data: QuestionDetailData }> {
  const result = await getSupabaseAndUser();
  if (!result.ok) return { error: result.error };
  const { supabase, user } = result;

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

  if (qError || !question) return { error: 'Question not found' };

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

  const revs = (revisions ?? []) as QuestionRevisionEntry[];
  const state = questionState({ revisions: revs, today, userTimezone: timezone });
  const completedCount = revs.filter((r) => r.completed_at !== null).length;
  const remainingCount = 5 - completedCount;
  const nextPending = revs
    .filter((r) => r.completed_at === null && r.due_date !== null)
    .sort((a, b) => a.index - b.index)[0];
  const completedRevisions = revs
    .filter((r) => r.completed_at !== null)
    .sort((a, b) => a.index - b.index);
  const allRevisions = [...revs].sort((a, b) => a.index - b.index);

  return {
    data: {
      questionId: question.id,
      subjectId: question.subject_id,
      subjectName: subject?.name ?? '',
      title: question.title,
      linkUrl: question.link_url ?? '',
      description: question.description ?? '',
      state,
      nextRevisionId: nextPending?.id ?? null,
      completedCount,
      remainingCount,
      completedRevisions,
      allRevisions,
    },
  };
}

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
