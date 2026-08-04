import type { Task } from '@/lib/api';

export const ACTIVE_TASK_STATUSES = ['pending', 'running', 'waiting_daily_limit', 'stopping'] as const;
export const TASK_DETAIL_SNAPSHOT_STATUSES = ['running', 'waiting_daily_limit', 'stopping', 'stopped', 'success', 'partial_success', 'failed'] as const;
export const TERMINAL_TASK_STATUSES = ['stopped', 'success', 'partial_success', 'failed'] as const;

export function isActiveTaskStatus(status: Task['status']) {
  return ACTIVE_TASK_STATUSES.includes(status as (typeof ACTIVE_TASK_STATUSES)[number]);
}

export function isTerminalTaskStatus(status: Task['status']) {
  return TERMINAL_TASK_STATUSES.includes(status as (typeof TERMINAL_TASK_STATUSES)[number]);
}
