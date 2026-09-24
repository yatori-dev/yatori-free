import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  getTask,
  getUserFacingErrorMessage,
  isAuthExitError,
  type Task,
  type TaskConfigSnapshot,
  type TaskProgress,
} from '@/lib/api';
import {
  isTerminalTaskStatus,
  TASK_DETAIL_SNAPSHOT_STATUSES,
} from '@/lib/taskStatus';

export interface TaskProgressSnapshot {
  status: Task['status'];
  configSnapshot?: TaskConfigSnapshot;
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
  const inFlightRef = useRef(new Map<string, AbortController>());
  const terminalSnapshotIdsRef = useRef(new Set<string>());

  const taskIdsToPoll = tasks
    .filter((task) => task.status === 'running' || task.status === 'stopping')
    .map((task) => task.id)
    .join('|');
  const terminalTaskIds = tasks
    .filter((task) => TASK_DETAIL_SNAPSHOT_STATUSES.includes(task.status as (typeof TASK_DETAIL_SNAPSHOT_STATUSES)[number]) && isTerminalTaskStatus(task.status))
    .map((task) => task.id)
    .join('|');

  const fetchTaskSnapshot = useEffectEvent(async (taskId: string) => {
    if (inFlightRef.current.has(taskId)) {
      return;
    }
    const requestId = (latestRequestIdRef.current.get(taskId) ?? 0) + 1;
    latestRequestIdRef.current.set(taskId, requestId);
    const controller = new AbortController();
    inFlightRef.current.set(taskId, controller);

    try {
      const response = await getTask(taskId, { signal: controller.signal });
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
            configSnapshot: response.data.configSnapshot,
            progress: nextProgress,
            errorMessage: '',
          },
        };
      });
    } catch (error) {
      if (error instanceof Error && 'kind' in error && error.kind === 'aborted') {
        return;
      }
      if (isAuthExitError(error)) {
        onUnauthorized();
        return;
      }

      if (latestRequestIdRef.current.get(taskId) === requestId) {
        setSnapshots((previous) => ({
          ...previous,
          [taskId]: {
            status: previous[taskId]?.status ?? 'pending',
            configSnapshot: previous[taskId]?.configSnapshot,
            progress: previous[taskId]?.progress ?? null,
            errorMessage: getUserFacingErrorMessage(error, '获取任务进度失败'),
          },
        }));
      }
    } finally {
      if (inFlightRef.current.get(taskId) === controller) {
        inFlightRef.current.delete(taskId);
      }
    }
  });

  useEffect(() => {
    const taskIds = taskIdsToPoll.split('|');
    const activeIds = new Set(taskIdsToPoll ? taskIds : []);
    for (const [taskId, controller] of inFlightRef.current) {
      if (!activeIds.has(taskId)) controller.abort();
    }
    setSnapshots((previous) => {
      const next = { ...previous };
      for (const taskId of Object.keys(next)) {
        if (!tasks.some((task) => task.id === taskId)) delete next[taskId];
      }
      return next;
    });
    if (!taskIdsToPoll) return;
    taskIds.forEach((taskId) => void fetchTaskSnapshot(taskId));
    const timer = window.setInterval(() => taskIds.forEach((taskId) => void fetchTaskSnapshot(taskId)), 2500);

    return () => {
      window.clearInterval(timer);
      for (const taskId of taskIds) inFlightRef.current.get(taskId)?.abort();
    };
  }, [taskIdsToPoll, tasks]);

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

  useEffect(() => () => {
    for (const controller of inFlightRef.current.values()) controller.abort();
    inFlightRef.current.clear();
  }, []);

  return snapshots;
}
