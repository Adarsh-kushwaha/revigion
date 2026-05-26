import { describe, it, expect } from 'vitest';
import { questionState } from '../question-state';

const TZ = 'UTC';

function today(): Date {
  return new Date('2024-06-10T12:00:00Z');
}

describe('questionState', () => {
  it('returns Completed when R5 has completed_at', () => {
    const revisions = [
      { index: 1, due_date: null, completed_at: '2024-01-01T00:00:00Z' },
      { index: 2, due_date: '2024-01-04', completed_at: '2024-01-04T00:00:00Z' },
      { index: 3, due_date: '2024-01-09', completed_at: '2024-01-09T00:00:00Z' },
      { index: 4, due_date: '2024-01-19', completed_at: '2024-01-19T00:00:00Z' },
      { index: 5, due_date: '2024-02-03', completed_at: '2024-02-03T00:00:00Z' },
    ];
    expect(questionState({ revisions, today: today(), userTimezone: TZ })).toBe('Completed');
  });

  it('returns Missed when any pending revision due_date < today', () => {
    const revisions = [
      { index: 1, due_date: null, completed_at: '2024-05-01T00:00:00Z' },
      { index: 2, due_date: '2024-06-01', completed_at: null },
      { index: 3, due_date: null, completed_at: null },
      { index: 4, due_date: null, completed_at: null },
      { index: 5, due_date: null, completed_at: null },
    ];
    expect(questionState({ revisions, today: today(), userTimezone: TZ })).toBe('Missed');
  });

  it('returns DueToday when next pending revision due_date = today', () => {
    const revisions = [
      { index: 1, due_date: null, completed_at: '2024-06-07T00:00:00Z' },
      { index: 2, due_date: '2024-06-10', completed_at: null },
      { index: 3, due_date: null, completed_at: null },
      { index: 4, due_date: null, completed_at: null },
      { index: 5, due_date: null, completed_at: null },
    ];
    expect(questionState({ revisions, today: today(), userTimezone: TZ })).toBe('DueToday');
  });

  it('returns Normal when next pending revision is in the future', () => {
    const revisions = [
      { index: 1, due_date: null, completed_at: '2024-06-07T00:00:00Z' },
      { index: 2, due_date: '2024-06-15', completed_at: null },
      { index: 3, due_date: null, completed_at: null },
      { index: 4, due_date: null, completed_at: null },
      { index: 5, due_date: null, completed_at: null },
    ];
    expect(questionState({ revisions, today: today(), userTimezone: TZ })).toBe('Normal');
  });

  it('Completed beats Missed: R5 done + past due on R2 → Completed', () => {
    const revisions = [
      { index: 1, due_date: null, completed_at: '2024-01-01T00:00:00Z' },
      { index: 2, due_date: '2024-01-04', completed_at: null },
      { index: 3, due_date: null, completed_at: null },
      { index: 4, due_date: null, completed_at: null },
      { index: 5, due_date: null, completed_at: '2024-06-09T00:00:00Z' },
    ];
    expect(questionState({ revisions, today: today(), userTimezone: TZ })).toBe('Completed');
  });

  it('Missed beats DueToday', () => {
    const revisions = [
      { index: 1, due_date: null, completed_at: '2024-05-01T00:00:00Z' },
      // R2 missed
      { index: 2, due_date: '2024-06-01', completed_at: null },
      // R3 due today (but R2 is already missed, so this shouldn't matter)
      { index: 3, due_date: '2024-06-10', completed_at: null },
      { index: 4, due_date: null, completed_at: null },
      { index: 5, due_date: null, completed_at: null },
    ];
    expect(questionState({ revisions, today: today(), userTimezone: TZ })).toBe('Missed');
  });

  it('freshly created: R1 done, R2 pending future → Normal', () => {
    const revisions = [
      { index: 1, due_date: null, completed_at: '2024-06-10T08:00:00Z' },
      { index: 2, due_date: '2024-06-13', completed_at: null },
      { index: 3, due_date: null, completed_at: null },
      { index: 4, due_date: null, completed_at: null },
      { index: 5, due_date: null, completed_at: null },
    ];
    expect(questionState({ revisions, today: today(), userTimezone: TZ })).toBe('Normal');
  });

  it('midnight boundary: due date = today in user TZ (America/New_York)', () => {
    // 2024-06-10 in New York is still 2024-06-10 even at midnight UTC
    const revisions = [
      { index: 1, due_date: null, completed_at: '2024-06-07T00:00:00Z' },
      { index: 2, due_date: '2024-06-10', completed_at: null },
      { index: 3, due_date: null, completed_at: null },
      { index: 4, due_date: null, completed_at: null },
      { index: 5, due_date: null, completed_at: null },
    ];
    // noon UTC on Jun 10 = 8am ET on Jun 10 → still June 10 in NY
    const todayNoon = new Date('2024-06-10T12:00:00Z');
    expect(questionState({ revisions, today: todayNoon, userTimezone: 'America/New_York' })).toBe('DueToday');
  });
});
