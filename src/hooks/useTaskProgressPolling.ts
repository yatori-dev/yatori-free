import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  getTask,
  getUserFacingErrorMessage,
  isAuthExitError,
  type Task,
  type TaskProgress,
} from '@/lib/api';
import {
  isTerminalTaskStatus,
  TASK_DETAIL_SNAPSHOT_STATUSES,
} from '@/lib/taskStatus';

export interface TaskProgressSnapshot {
  status: Task['status'];
  progress: TaskProgress | null;
  errorMessage: string;
}

interface UseTaskProgressPollingOptions {
  tasks: Task[];
  onUnauthorized: () => void;
}

function canReplaceProgress(current: TaskProgress | null, next: TaskProgress | null) {
  if (!next || !current) {
    return true;
  }

  const currentTime = Date.parse(current.updatedAt ?? '');
  const nextTime = Date.parse(next.updatedAt ?? '');

  return Number.isNaN(currentTime) || Number.isNaN(nextTime) || nextTime >= currentTime;
}

export function useTaskProgressPolling({ tasks, onUnauthorized }: UseTaskProgressPollingOptions) {
  const [snapshots, setSnapshots] = useState<Record<string, TaskProgressSnapshot>>({});
  const latestRequestIdRef = useRef(new Map<string, number>());
  const terminalSnapshotIdsRef = useRef(new Set<string>());

  const taskIdsToPoll = tasks
    .filter((task) => task.status === 'running' || task.status === 'waiting_daily_limit' || task.status === 'stopping')
    .map((task) => task.id)
    .join('|');
  const terminalTaskIds = tasks
    .filter((task) => TASK_DETAIL_SNAPSHOT_STATUSES.includes(task.status as (typeof TASK_DETAIL_SNAPSHOT_STATUSES)[number]) && isTerminalTaskStatus(task.status))
    .map((task) => task.id)
    .join('|');

  const fetchTaskSnapshot = useEffectEvent(async (taskId: string) => {
    const requestId = (latestRequestIdRef.current.get(taskId) ?? 0) + 1;
    latestRequestIdRef.current.set(taskId, requestId);

    try {
      const response = await getTask(taskId);
      if (latestRequestIdRef.current.get(taskId) !== requestId) {
        return;
      }

      setSnapshots((previous) => {
        const current = previous[taskId];
        const nextProgress = canReplaceProgress(current?.progress ?? null, response.data.progress ?? null)
          ? response.data.progress ?? null
          : current?.progress ?? null;

        return {
          ...previous,
          [taskId]: {
            status: response.data.status,
            progress: nextProgress,
            errorMessage: '',
          },
        };
      });
    } catch (error) {
      if (isAuthExitError(error)) {
        onUnauthorized();
        return;
      }

      if (latestRequestIdRef.current.get(taskId) === requestId) {
        setSnapshots((previous) => ({
          ...previous,
          [taskId]: {
            status: previous[taskId]?.status ?? 'pending',
            progress: previous[taskId]?.progress ?? null,
            errorMessage: getUserFacingErrorMessage(error, '获取任务进度失败'),
          },
        }));
      }
    }
  });

  useEffect(() => {
    if (!taskIdsToPoll) {
      return;
    }

    const taskIds = taskIdsToPoll.split('|');
    taskIds.forEach((taskId) => void fetchTaskSnapshot(taskId));
    const timer = window.setInterval(() => {
      taskIds.forEach((taskId) => void fetchTaskSnapshot(taskId));
    }, 2500);

    return () => window.clearInterval(timer);
  }, [taskIdsToPoll]);

  useEffect(() => {
    if (!terminalTaskIds) {
      return;
    }

    terminalTaskIds.split('|').forEach((taskId) => {
      if (!terminalSnapshotIdsRef.current.has(taskId)) {
        terminalSnapshotIdsRef.current.add(taskId);
        void fetchTaskSnapshot(taskId);
      }
    });
  }, [terminalTaskIds]);

  return snapshots;
}
