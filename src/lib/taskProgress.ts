import type { CourseSummary } from './api';

export interface CourseTaskPointProgress {
  total: number;
  completed: number;
}

export type CourseTaskPointProgressMap = Record<string, CourseTaskPointProgress>;

export function createCourseTaskPointProgressMap(courses: CourseSummary[]): CourseTaskPointProgressMap {
  return courses.reduce<CourseTaskPointProgressMap>((map, course) => {
    const total = typeof course.jobCount === 'number' && Number.isFinite(course.jobCount)
      ? Math.max(0, course.jobCount)
      : 0;
    const completed = typeof course.jobFinishCount === 'number' && Number.isFinite(course.jobFinishCount)
      ? Math.max(0, Math.min(total, course.jobFinishCount))
      : 0;
    const progress = { total, completed };

    map[course.key] = progress;
    if (course.courseId) {
      map[course.courseId] = progress;
    }

    return map;
  }, {});
}

export function getTaskCourseTaskPointProgress(
  includeCourses: string[] | undefined,
  progressMap: CourseTaskPointProgressMap,
) {
  if (!includeCourses || includeCourses.length === 0) {
    return undefined;
  }

  let total = 0;
  let completed = 0;
  for (const identifier of includeCourses) {
    const progress = progressMap[identifier.trim()];
    if (!progress) {
      continue;
    }

    total += progress.total;
    completed += progress.completed;
  }

  return { total, completed };
}
