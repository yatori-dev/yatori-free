import type { CourseSummary } from './api';

export interface CourseTaskPointProgress {
  total: number;
  completed: number;
}

export type CourseTaskPointProgressMap = Record<string, CourseTaskPointProgress>;

export function createCourseTaskPointProgressMap(courses: CourseSummary[]): CourseTaskPointProgressMap {
  return courses.reduce<CourseTaskPointProgressMap>((map, course) => {
    if (typeof course.jobCount !== 'number' || !Number.isFinite(course.jobCount) || course.jobCount < 0) {
      return map;
    }

    const completed = typeof course.jobFinishCount === 'number' && Number.isFinite(course.jobFinishCount)
      ? Math.max(0, Math.min(course.jobCount, course.jobFinishCount))
      : 0;
    const progress = { total: course.jobCount, completed };

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
      return undefined;
    }

    total += progress.total;
    completed += progress.completed;
  }

  return { total, completed };
}
