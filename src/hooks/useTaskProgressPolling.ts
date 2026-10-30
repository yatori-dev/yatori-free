import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  getTaskProgress,
  getUserFacingErrorMessage,
  isAuthExitError,
  type Task,
  type TaskConfigSnapshot,
  type TaskProgress,
} from '@/lib/api';
import { isActiveTaskStatus, isTerminalTaskStatus } from '@/lib/taskStatus';

export interface TaskProgressSnapshot {
  status: Task['status'];
  configSnapshot?: TaskConfigSnapshot;
  progress: TaskProgress | null;
  errorMessage: string;
}

interface UseTaskProgressPollingOptions {
  tasks: Task[];
  onUnauthorized: () => void;
  enabled?: boolean;
}

function canReplaceProgress(current: TaskProgress | null, next: TaskProgress | null) {
  if (!next || !current) return true;
  const currentTime = Date.parse(current.updatedAt ?? '');
  const nextTime = Date.parse(next.updatedAt ?? '');
  return Number.isNaN(currentTime) || Number.isNaN(nextTime) || nextTime >= currentTime;
}

export function useTaskProgressPolling({
  tasks, onUnauthorized, enabled = true,
}: UseTaskProgressPollingOptions) {
  const [snapshots, setSnapshots] = useState<Record<string, TaskProgressSnapshot>>({});
  const latestRequestIdRef = useRef(new Map<string, number>());
  const inFlightRef = useRef(new Map<string, AbortController>());
  const visibleTaskIds = tasks.map((task) => task.id).sort().join('|');
  const taskIdsToPoll = tasks
    .filter((task) => isActiveTaskStatus(task.status) && !isTerminalTaskStatus(snapshots[task.id]?.status ?? task.status))
    .map((task) => task.id).sort().join('|');

  const fetchTaskSnapshot = useEffectEvent(async (taskId: string) => {
    if (document.hidden || inFlightRef.current.has(taskId)) return;
    const requestId = (latestRequestIdRef.current.get(taskId) ?? 0) + 1;
    latestRequestIdRef.current.set(taskId, requestId);
    const controller = new AbortController();
    inFlightRef.current.set(taskId, controller);
    try {
      const response = await getTaskProgress(taskId, { signal: controller.signal });
      if (controller.signal.aborted || latestRequestIdRef.current.get(taskId) !== requestId) return;
      setSnapshots((previous) => {
        const current = previous[taskId];
        return {
          ...previous,
          [taskId]: {
            status: response.data.status,
            progress: canReplaceProgress(current?.progress ?? null, response.data.progress ?? null)
              ? response.data.progress ?? null : current?.progress ?? null,
            errorMessage: '',
          },
        };
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      if (isAuthExitError(error)) {
        onUnauthorized();
        return;
      }
      if (latestRequestIdRef.current.get(taskId) === requestId) {
        const task = tasks.find((item) => item.id === taskId);
        if (
          task?.status === 'stopping' &&
          typeof error === 'object' &&
          error !== null &&
          'status' in error &&
          error.status === 404 &&
          getUserFacingErrorMessage(error) === '任务不存在'
        ) {
          setSnapshots((previous) => ({
            ...previous,
            [taskId]: {
              status: 'stopped',
              progress: previous[taskId]?.progress ?? null,
              errorMessage: '',
            },
          }));
          return;
        }
        setSnapshots((previous) => ({
          ...previous,
          [taskId]: {
            status: previous[taskId]?.status ?? tasks.find((task) => task.id === taskId)?.status ?? 'pending',
            progress: previous[taskId]?.progress ?? null,
            errorMessage: getUserFacingErrorMessage(error, '获取任务进度失败'),
          },
        }));
      }
    } finally {
      if (inFlightRef.current.get(taskId) === controller) inFlightRef.current.delete(taskId);
    }
  });

  useEffect(() => {
    const taskIds = visibleTaskIds ? new Set(visibleTaskIds.split('|')) : new Set<string>();
    const timer = window.setTimeout(() => {
      setSnapshots((previous) => {
        if (Object.keys(previous).every((taskId) => taskIds.has(taskId))) return previous;
        return Object.fromEntries(Object.entries(previous).filter(([taskId]) => taskIds.has(taskId)));
      });
      for (const taskId of latestRequestIdRef.current.keys()) {
        if (!taskIds.has(taskId)) latestRequestIdRef.current.delete(taskId);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [visibleTaskIds]);

  useEffect(() => {
    if (!enabled || !taskIdsToPoll) return;
    const taskIds = taskIdsToPoll.split('|');
    const inFlight = inFlightRef.current;
    let timer: number | undefined;
    const stop = () => {
      window.clearInterval(timer);
      timer = undefined;
      for (const taskId of taskIds) {
        inFlight.get(taskId)?.abort();
        inFlight.delete(taskId);
      }
    };
    const start = () => {
      stop();
      if (document.hidden) return;
      taskIds.forEach((taskId) => void fetchTaskSnapshot(taskId));
      timer = window.setInterval(() => {
        taskIds.forEach((taskId) => void fetchTaskSnapshot(taskId));
      }, 2500);
    };
    const handleVisibilityChange = () => document.hidden ? stop() : start();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    start();
    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [taskIdsToPoll, enabled]);

  return snapshots;
}
