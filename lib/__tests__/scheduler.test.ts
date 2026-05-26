import { describe, it, expect } from 'vitest';
import { nextDueDate } from '../scheduler';

function utcMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

describe('nextDueDate', () => {
  it('R1 done today → R2 due in 3 days', () => {
    const now = utcMidnight(2024, 6, 10);
    const result = nextDueDate({ lastCompletedAt: now, nextIndex: 2, userTimezone: 'UTC' });
    expect(result).toEqual(utcMidnight(2024, 6, 13));
  });

  it('index 2 → +3 days', () => {
    const now = utcMidnight(2024, 1, 1);
    const result = nextDueDate({ lastCompletedAt: now, nextIndex: 2, userTimezone: 'UTC' });
    expect(result).toEqual(utcMidnight(2024, 1, 4));
  });

  it('index 3 → +5 days', () => {
    const now = utcMidnight(2024, 1, 1);
    const result = nextDueDate({ lastCompletedAt: now, nextIndex: 3, userTimezone: 'UTC' });
    expect(result).toEqual(utcMidnight(2024, 1, 6));
  });

  it('index 4 → +10 days', () => {
    const now = utcMidnight(2024, 1, 1);
    const result = nextDueDate({ lastCompletedAt: now, nextIndex: 4, userTimezone: 'UTC' });
    expect(result).toEqual(utcMidnight(2024, 1, 11));
  });

  it('index 5 → +15 days', () => {
    const now = utcMidnight(2024, 1, 1);
    const result = nextDueDate({ lastCompletedAt: now, nextIndex: 5, userTimezone: 'UTC' });
    expect(result).toEqual(utcMidnight(2024, 1, 16));
  });

  it('late completion re-anchors: R2 completed 5 days late → R3 due = late date + 5', () => {
    // R2 was due Jan 4 but completed Jan 9 (5 days late)
    const lateCompletion = utcMidnight(2024, 1, 9);
    const result = nextDueDate({ lastCompletedAt: lateCompletion, nextIndex: 3, userTimezone: 'UTC' });
    expect(result).toEqual(utcMidnight(2024, 1, 14));
  });

  it('DST boundary: America/New_York clock-forward (March)', () => {
    // March 9 2025 is when DST starts in New York
    // Completed at 11pm UTC on Mar 9 = Mar 9 in New York (it's only 6pm ET)
    const completedAt = new Date('2025-03-09T23:00:00Z');
    const result = nextDueDate({ lastCompletedAt: completedAt, nextIndex: 2, userTimezone: 'America/New_York' });
    // Mar 9 in NY + 3 days = Mar 12
    expect(result).toEqual(utcMidnight(2025, 3, 12));
  });

  it('year boundary: Dec 30 + 3 days = Jan 2', () => {
    const now = utcMidnight(2024, 12, 30);
    const result = nextDueDate({ lastCompletedAt: now, nextIndex: 2, userTimezone: 'UTC' });
    expect(result).toEqual(utcMidnight(2025, 1, 2));
  });
});
