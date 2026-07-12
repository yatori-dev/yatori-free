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

function getMetricGroupPercent(metrics: StudyMetricProgress[]) {
  const percents = metrics
    .map(getStudyMetricPercent)
    .filter((percent): percent is number => percent !== null);

  if (percents.length === 0) {
    return null;
  }

  return percents.reduce((sum, percent) => sum + percent, 0) / percents.length;
}

export function getStudyProgressPercents(courses: CourseStudyProgress[]) {
  return [
    getMetricGroupPercent(courses.map((course) => course.visitCount)),
    getMetricGroupPercent(courses.map((course) => course.studyMinutes)),
  ].filter((percent): percent is number => percent !== null);
}
