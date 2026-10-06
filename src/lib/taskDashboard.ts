import type { Task } from './api';
import { isActiveTaskStatus } from './taskStatus';

export const taskStatusLabels: Record<Task['status'], string> = {
  pending: '待执行',
  running: '运行中',
  waiting_daily_limit: '等待次日继续',
  stopping: '停止中',
  stopped: '已停止',
  success: '已完成',
  partial_success: '部分完成',
  failed: '失败',
};

export const taskGroups = [
  { key: 'active', label: '进行中', color: 'var(--info)' },
  { key: 'success', label: '已完成', color: 'var(--success)' },
  { key: 'attention', label: '需关注', color: 'var(--danger)' },
  { key: 'stopped', label: '已停止', color: 'var(--muted-foreground)' },
] as const;

export type TaskGroup = (typeof taskGroups)[number]['key'];

export function getTaskGroup(status: Task['status']): TaskGroup {
  if (isActiveTaskStatus(status)) return 'active';
  if (status === 'success') return 'success';
  if (status === 'stopped') return 'stopped';
  return 'attention';
}

export function getTaskDistribution(tasks: Task[]) {
  const counts = { active: 0, success: 0, attention: 0, stopped: 0 };
  for (const task of tasks) counts[getTaskGroup(task.status)] += 1;
  return taskGroups.map((group) => ({
    ...group,
    count: counts[group.key],
    fill: group.color,
  }));
}

const dateKeyFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
});
const dateLabelFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', month: 'numeric', day: 'numeric',
});

export function getTaskCreationHistory(tasks: Task[], days: number) {
  const now = Date.now();
  const history = Array.from({ length: days }, (_, index) => {
    const date = new Date(now - (days - index - 1) * 86_400_000);
    return {
      date: dateKeyFormatter.format(date),
      label: dateLabelFormatter.format(date),
      count: 0,
    };
  });
  const daysByDate = new Map(history.map((day) => [day.date, day]));
  let missingDates = 0;
  for (const task of tasks) {
    const time = Date.parse(task.createdAt ?? '');
    if (!Number.isFinite(time)) {
      missingDates += 1;
      continue;
    }
    const day = daysByDate.get(dateKeyFormatter.format(new Date(time)));
    if (day) day.count += 1;
  }
  return { history, missingDates };
}
