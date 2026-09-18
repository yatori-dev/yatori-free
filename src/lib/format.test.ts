import { describe, expect, it } from 'vitest';
import { formatLocalDateTime } from './format';

describe('formatLocalDateTime', () => {
  it('formats Unix millisecond timestamps returned by course task APIs', () => {
    const timestamp = new Date(2026, 8, 19, 12, 34, 56).getTime();

    expect(formatLocalDateTime(timestamp, { includeYear: true })).toBe('2026-09-19 12:34:56');
  });
});
