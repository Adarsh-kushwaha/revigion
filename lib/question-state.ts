export type QuestionState = 'Completed' | 'Missed' | 'DueToday' | 'Normal';

export function questionState(input: {
  revisions: { index: number; due_date: string | null; completed_at: string | null }[];
  today: Date;
  userTimezone: string;
}): QuestionState {
  const { revisions, today, userTimezone } = input;

  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: userTimezone }).format(today);

  const r5 = revisions.find((r) => r.index === 5);
  if (r5?.completed_at) return 'Completed';

  const hasMissed = revisions.some(
    (r) => r.due_date !== null && r.completed_at === null && r.due_date < todayStr,
  );
  if (hasMissed) return 'Missed';

  const nextPending = revisions
    .filter((r) => r.completed_at === null && r.due_date !== null)
    .sort((a, b) => a.index - b.index)[0];

  if (nextPending?.due_date === todayStr) return 'DueToday';

  return 'Normal';
}
