import { getUserFacingErrorMessage, type Task } from '@/lib/api';

export const ACTIVE_TASK_STATUSES = [
  'pending',
  'queued',
  'running',
  'waiting_daily_limit',
  'stopping',
] as const;
export const TASK_DETAIL_SNAPSHOT_STATUSES = [
  'queued',
  'running',
  'waiting_daily_limit',
  'stopping',
  'stopped',
  'success',
  'failed',
] as const;
export const TERMINAL_TASK_STATUSES = [
  'stopped',
  'success',
  'failed',
] as const;

export function isActiveTaskStatus(status: Task['status']) {
  return ACTIVE_TASK_STATUSES.includes(
    status as (typeof ACTIVE_TASK_STATUSES)[number],
  );
}

export function isTerminalTaskStatus(status: Task['status']) {
  return TERMINAL_TASK_STATUSES.includes(
    status as (typeof TERMINAL_TASK_STATUSES)[number],
  );
}

export function isStoppedTaskNotFound(error: unknown, stopKnown: boolean) {
  return (
    stopKnown &&
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 404 &&
    getUserFacingErrorMessage(error) === '任务不存在'
  );
}
