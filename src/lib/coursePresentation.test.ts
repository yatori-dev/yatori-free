import { describe, expect, it } from 'vitest';
import { getSubmittedRedoCount } from './coursePresentation';

describe('getSubmittedRedoCount', () => {
  it('returns the remaining count for a submitted work', () => {
    expect(getSubmittedRedoCount('待批阅', 3)).toBe(3);
    expect(getSubmittedRedoCount('已完成', 0)).toBe(0);
  });

  it('hides the count for an unsubmitted work', () => {
    expect(getSubmittedRedoCount('未交', 3)).toBeNull();
  });

  it('hides missing or invalid counts', () => {
    expect(getSubmittedRedoCount('已完成')).toBeNull();
    expect(getSubmittedRedoCount('已完成', -1)).toBeNull();
  });
});
