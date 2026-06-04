export interface HeatmapDay {
  date: string; // YYYY-MM-DD in user TZ
  count: number;
}

function ymdInTz(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d);
}

function addDays(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + delta));
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(next);
}

export function buildHeatmap(
  completedAtIsoList: string[],
  userTimezone: string,
  weeks: number = 24,
): { heatmap: HeatmapDay[]; currentStreak: number; longestStreak: number } {
  const todayYmd = ymdInTz(new Date(), userTimezone);

  const counts = new Map<string, number>();
  for (const iso of completedAtIsoList) {
    const key = ymdInTz(new Date(iso), userTimezone);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const totalDays = weeks * 7;
  const startYmd = addDays(todayYmd, -(totalDays - 1));

  const heatmap: HeatmapDay[] = [];
  let cursor = startYmd;
  for (let i = 0; i < totalDays; i++) {
    heatmap.push({ date: cursor, count: counts.get(cursor) ?? 0 });
    cursor = addDays(cursor, 1);
  }

  let currentStreak = 0;
  let walk = todayYmd;
  while ((counts.get(walk) ?? 0) > 0) {
    currentStreak++;
    walk = addDays(walk, -1);
  }

  let longestStreak = 0;
  let run = 0;
  for (const cell of heatmap) {
    if (cell.count > 0) {
      run++;
      if (run > longestStreak) longestStreak = run;
    } else {
      run = 0;
    }
  }
  if (currentStreak > longestStreak) longestStreak = currentStreak;

  return { heatmap, currentStreak, longestStreak };
}
