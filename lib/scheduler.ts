const GAP: Record<2 | 3 | 4 | 5, number> = { 2: 3, 3: 5, 4: 10, 5: 15 };

export function nextDueDate(input: {
  lastCompletedAt: Date;
  nextIndex: 2 | 3 | 4 | 5;
  userTimezone: string;
}): Date {
  const { lastCompletedAt, nextIndex, userTimezone } = input;
  const gap = GAP[nextIndex];

  // Get the calendar date of lastCompletedAt in userTimezone as YYYY-MM-DD
  const localDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: userTimezone }).format(lastCompletedAt);
  const [year, month, day] = localDateStr.split('-').map(Number);

  // Add gap days in calendar space
  const resultDate = new Date(Date.UTC(year, month - 1, day + gap));

  return resultDate;
}
