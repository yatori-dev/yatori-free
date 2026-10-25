import { describe, expect, it } from 'vitest';
import {
  getTaskProgressBreakdown,
  getTaskProgressPercent,
} from './taskProgressPresentation';

describe('task progress presentation', () => {
  it('counts every terminal outcome as processed and preserves categories', () => {
    const progress = {
      totalUnits: 10,
      completedUnits: 4,
      failedUnits: 2,
      unresolvedUnits: 1,
      unfinishedUnits: 3,
      failedTaskPoints: 1,
      failedExams: 1,
      unresolvedWorks: 1,
      message: '',
    };

    expect(getTaskProgressBreakdown(progress)).toEqual({
      completed: 4,
      failed: 2,
      unresolved: 1,
      unfinished: 3,
      processed: 10,
      total: 10,
      failedCategories: [
        { label: '章节任务点', count: 1 },
        { label: '考试', count: 1 },
      ],
      unresolvedCategories: [{ label: '作业', count: 1 }],
    });
    expect(getTaskProgressPercent(progress)).toBe(100);
  });

  it('keeps unclassified failure and unresolved counts visible', () => {
    const progress = {
      totalUnits: 5,
      completedUnits: 2,
      failedUnits: 1,
      unresolvedUnits: 1,
      message: '',
    };

    expect(getTaskProgressBreakdown(progress).failedCategories).toEqual([
      { label: '任务单元', count: 1 },
    ]);
    expect(getTaskProgressBreakdown(progress).unresolvedCategories).toEqual([
      { label: '任务单元', count: 1 },
    ]);
    expect(getTaskProgressPercent(progress)).toBe(80);
  });
});
