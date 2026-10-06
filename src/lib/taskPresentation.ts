import type { Task } from './api';
import type { TaskProgressSnapshot } from '@/hooks/useTaskProgressPolling';
import { isTerminalTaskStatus } from './taskStatus';

export function getTaskPresentation(task: Task, snapshot?: TaskProgressSnapshot) {
  const taskProgress = task.progress ?? null;
  const snapshotProgress = snapshot?.progress ?? null;
  const taskTime = Date.parse(taskProgress?.updatedAt ?? '');
  const snapshotTime = Date.parse(snapshotProgress?.updatedAt ?? '');
  const progress = !snapshotProgress
    ? taskProgress
    : !taskProgress || Number.isNaN(taskTime) || Number.isNaN(snapshotTime) || snapshotTime >= taskTime
      ? snapshotProgress
      : taskProgress;
  const status = isTerminalTaskStatus(task.status)
    ? task.status
    : snapshot && isTerminalTaskStatus(snapshot.status)
      ? snapshot.status
      : task.status === 'stopping'
        ? task.status
        : (snapshot?.status ?? task.status);

  return {
    status,
    progress,
    configSnapshot: snapshot?.configSnapshot ?? task.configSnapshot,
  };
}

export function getTaskCreatedTime(task: Task) {
  const time = Date.parse(task.createdAt ?? '');
  return Number.isFinite(time) ? time : 0;
}
