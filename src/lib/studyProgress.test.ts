import { describe, expect, it } from 'vitest';
import { getStudyMetricPercent, getStudyProgressPercents } from './studyProgress';

const metric = (current: number, baseline = 10, target = 20, status: 'running' | 'disabled' = 'running') => ({ baseline, current, target, status, message: '' });

describe('study progress', () => {
  it('returns null for disabled or non-positive targets and clamps percentages', () => {
    expect(getStudyMetricPercent(metric(15))).toBe(50);
    expect(getStudyMetricPercent(metric(30))).toBe(100);
    expect(getStudyMetricPercent(metric(0))).toBe(0);
    expect(getStudyMetricPercent(metric(15, 10, 10))).toBeNull();
    expect(getStudyMetricPercent(metric(15, 10, 20, 'disabled'))).toBeNull();
  });

  it('omits unavailable metrics from the aggregate list', () => {
    expect(getStudyProgressPercents([{ classId: '1', courseName: 'A', visitCount: metric(15), videoStudyMinutes: metric(1, 1, 1), readMinutes: metric(30) }])).toEqual([50, 100]);
  });
});
