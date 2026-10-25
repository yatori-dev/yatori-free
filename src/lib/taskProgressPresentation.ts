import type { TaskProgress } from './api';

export interface TaskProgressCategory {
  label: string;
  count: number;
}

export interface TaskProgressBreakdown {
  completed: number;
  failed: number;
  unresolved: number;
  unfinished: number;
  processed: number;
  total: number;
  failedCategories: TaskProgressCategory[];
  unresolvedCategories: TaskProgressCategory[];
}

function nonNegative(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, value)
    : 0;
}

function getUnclassifiedCount(total: number, classified: number) {
  return Math.max(0, total - classified);
}

export function getTaskProgressBreakdown(
  progress: TaskProgress | null | undefined,
): TaskProgressBreakdown {
  const completed = nonNegative(progress?.completedUnits);
  const failed = nonNegative(progress?.failedUnits);
  const unresolved = nonNegative(progress?.unresolvedUnits);
  const unfinished = nonNegative(progress?.unfinishedUnits);
  const failedTaskPoints = nonNegative(progress?.failedTaskPoints);
  const failedWorks = nonNegative(progress?.failedWorks);
  const failedExams = nonNegative(progress?.failedExams);
  const unresolvedTaskPoints = nonNegative(progress?.unresolvedTaskPoints);
  const unresolvedWorks = nonNegative(progress?.unresolvedWorks);
  const unresolvedExams = nonNegative(progress?.unresolvedExams);
  const failedClassified = failedTaskPoints + failedWorks + failedExams;
  const unresolvedClassified =
    unresolvedTaskPoints + unresolvedWorks + unresolvedExams;
  const total = nonNegative(progress?.totalUnits);

  return {
    completed,
    failed,
    unresolved,
    unfinished,
    processed: completed + failed + unresolved + unfinished,
    total,
    failedCategories: [
      { label: '章节任务点', count: failedTaskPoints },
      { label: '作业', count: failedWorks },
      { label: '考试', count: failedExams },
      {
        label: '任务单元',
        count: getUnclassifiedCount(failed, failedClassified),
      },
    ].filter((item) => item.count > 0),
    unresolvedCategories: [
      { label: '章节任务点', count: unresolvedTaskPoints },
      { label: '作业', count: unresolvedWorks },
      { label: '考试', count: unresolvedExams },
      {
        label: '任务单元',
        count: getUnclassifiedCount(unresolved, unresolvedClassified),
      },
    ].filter((item) => item.count > 0),
  };
}

export function getTaskProgressPercent(progress: TaskProgress | null | undefined) {
  const breakdown = getTaskProgressBreakdown(progress);
  if (breakdown.total <= 0) {
    return null;
  }

  return Math.max(
    0,
    Math.min(100, Math.round((breakdown.processed / breakdown.total) * 100)),
  );
}
