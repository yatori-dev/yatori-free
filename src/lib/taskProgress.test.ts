import { describe, expect, it } from 'vitest';
import { createCourseTaskPointProgressMap, getTaskCourseTaskPointProgress } from './taskProgress';

describe('task progress', () => {
  it('clamps invalid course counts and indexes by key and course id', () => {
    const map = createCourseTaskPointProgressMap([
      { key: 'k1', courseId: 'c1', courseName: 'A', processing: false, processingTaskId: '', jobCount: 4, jobFinishCount: 9 },
      { key: 'k2', courseName: 'B', processing: false, processingTaskId: '', jobCount: -1, jobFinishCount: 2 },
    ]);

    expect(map).toEqual({ k1: { total: 4, completed: 4 }, c1: { total: 4, completed: 4 }, k2: { total: 0, completed: 0 } });
    expect(getTaskCourseTaskPointProgress([' c1 ', 'k2', 'missing'], map)).toEqual({ total: 4, completed: 4 });
    expect(getTaskCourseTaskPointProgress([], map)).toBeUndefined();
  });
});
