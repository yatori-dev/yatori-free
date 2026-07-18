import type { CourseStudyProgress, StudyMetricProgress } from './api';

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function getStudyMetricPercent(metric: StudyMetricProgress) {
  const targetIncrement = metric.target - metric.baseline;

  if (metric.status === 'disabled' || targetIncrement <= 0) {
    return null;
  }

  return clampPercent(((metric.current - metric.baseline) / targetIncrement) * 100);
}

export function getStudyProgressPercents(courses: CourseStudyProgress[]) {
  return courses.flatMap((course) => [course.visitCount, course.videoStudyMinutes, course.readMinutes])
    .map(getStudyMetricPercent)
    .filter((percent): percent is number => percent !== null);
}
