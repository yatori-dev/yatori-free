import { describe, expect, it } from 'vitest';
import { formatLocalDateTime, getDeadlineUrgencyLabel, hasDeadlinePassed } from './format';

describe('hasDeadlinePassed', () => {
  const now = new Date(2026, 8, 20, 12).getTime();

  it('only treats finite deadlines at or before the current time as passed', () => {
    expect(hasDeadlinePassed(now - 1, now)).toBe(true);
    expect(hasDeadlinePassed(now, now)).toBe(true);
    expect(hasDeadlinePassed(now + 1, now)).toBe(false);
    expect(hasDeadlinePassed(undefined, now)).toBe(false);
  });
});

describe('getDeadlineUrgencyLabel', () => {
  const now = new Date(2026, 8, 20, 12).getTime();
  const hour = 60 * 60 * 1000;

  it('labels deadlines within 24 hours by urgency', () => {
    expect(getDeadlineUrgencyLabel(now + 30 * 60 * 1000, now)).toBe('即将截止');
    expect(getDeadlineUrgencyLabel(now + 5.2 * hour, now)).toBe('6小时内截止');
    expect(getDeadlineUrgencyLabel(now + 20 * hour, now)).toBe('1天内截止');
    expect(getDeadlineUrgencyLabel(now + 25 * hour, now)).toBeNull();
    expect(getDeadlineUrgencyLabel(now, now)).toBeNull();
  });
});

describe('formatLocalDateTime', () => {
  it('formats Unix millisecond timestamps returned by course task APIs', () => {
    const timestamp = new Date(2026, 8, 19, 12, 34, 56).getTime();

    expect(formatLocalDateTime(timestamp, { includeYear: true })).toBe('2026-09-19 12:34:56');
  });

  it('can omit seconds', () => {
    const timestamp = new Date(2026, 8, 19, 12, 34, 56).getTime();

    expect(formatLocalDateTime(timestamp, { includeYear: true, includeSeconds: false })).toBe('2026-09-19 12:34');
  });
});
