import { describe, expect, it } from 'vitest';
import { formatLocalDateTime, hasDeadlinePassed } from './format';

describe('hasDeadlinePassed', () => {
  const now = new Date(2026, 8, 20, 12).getTime();

  it('only treats finite deadlines at or before the current time as passed', () => {
    expect(hasDeadlinePassed(now - 1, now)).toBe(true);
    expect(hasDeadlinePassed(now, now)).toBe(true);
    expect(hasDeadlinePassed(now + 1, now)).toBe(false);
    expect(hasDeadlinePassed(undefined, now)).toBe(false);
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
