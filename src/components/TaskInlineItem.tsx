import React, { useEffect, useEffectEvent, useState } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  Square, 
  Bot, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  BookOpen,
  User as UserIcon,
  Settings2,
  Hourglass
} from 'lucide-react';
import {
  getTask,
  getTaskProgressStreamUrl,
  getUserFacingErrorMessage,
  isAuthExitError,
  TASK_PROGRESS_STREAM_EVENT,
  type Task,
  type TaskProgress,
} from '@/lib/api';
import { toast } from 'sonner';

interface TaskInlineItemProps {
  task: Task;
  courseNameByIdentifier?: Record<string, string>;
  onUnauthorized?: () => void;
  onStopTask: (taskId: string) => void;
}

function formatDateTime(value?: string | null) {
  if (!value) return '未知';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '未知';
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hr = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  return `${m}-${d} ${hr}:${min}:${sec}`;
}

function getProgressFallback(status: Task['status'], progressPercent = 0) {
  switch (status) {
    case 'success':
      return {
        percent: 100,
        course: '已完成',
        chapter: '全部任务已结束',
      };
    case 'partial_success':
      return {
        percent: progressPercent,
        course: '部分完成',
        chapter: '部分任务未完成',
      };
    case 'failed':
      return {
        percent: progressPercent,
        course: '执行失败',
        chapter: '未获得进度',
      };
    default:
      return {
        percent: progressPercent,
        course: '等待中...',
        chapter: '--',
      };
  }
}

function getAutoSubmitLabel(value: 0 | 1 | 2 | undefined) {
  if (value === 2) {
    return '智能提交';
  }

  if (value === 1) {
    return '自动提交';
  }

  return '仅保存';
}

export const TaskInlineItem: React.FC<TaskInlineItemProps> = ({ task, courseNameByIdentifier = {}, onUnauthorized, onStopTask }) => {
  const [progress, setProgress] = useState<TaskProgress | null>(() => task.progress ?? null);
  const [showConfig, setShowConfig] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [progressErrorMessage, setProgressErrorMessage] = useState('');

  const effectiveStatus = (progress?.status ?? task.status) as Task['status'];

  const applyProgress = useEffectEvent((nextProgress: TaskProgress) => {
    if (nextProgress.taskId !== task.id) {
      return;
    }

    setProgress((currentProgress) => {
      if (!currentProgress) {
        return nextProgress;
      }

      const currentTime = Date.parse(currentProgress.updatedAt ?? '');
      const nextTime = Date.parse(nextProgress.updatedAt ?? '');

      if (Number.isNaN(currentTime) || Number.isNaN(nextTime) || nextTime >= currentTime) {
        return nextProgress;
      }

      return currentProgress;
    });
  });

  const fetchProgress = useEffectEvent(async () => {
    try {
      const result = await getTask(task.id);
      if (result.code === 200 && result.data?.progress && result.data.progress.taskId === task.id) {
        setProgressErrorMessage('');
        applyProgress(result.data.progress);
      }
    } catch (err) {
      if (isAuthExitError(err)) {
        toast.error(getUserFacingErrorMessage(err, '登录已失效，请重新登录'));
        onUnauthorized?.();
        return;
      }

      setProgressErrorMessage(getUserFacingErrorMessage(err, '获取任务进度失败'));
    }
  });

  const handleStreamMessage = useEffectEvent((rawData: string) => {
    try {
      const nextProgress = JSON.parse(rawData) as TaskProgress;
      applyProgress(nextProgress);
    } catch {
      // Ignore malformed SSE chunks.
    }
  });

  useEffect(() => {
    const shouldFetchSnapshot = ['running', 'stopping', 'success', 'partial_success', 'failed'].includes(effectiveStatus);
    const shouldUseStream = effectiveStatus === 'running'
      || effectiveStatus === 'stopping';
    const snapshotTimer = shouldFetchSnapshot
      ? window.setTimeout(() => {
          void fetchProgress();
        }, 0)
      : null;

    if (!shouldUseStream) {
      return () => {
        if (snapshotTimer) {
          clearTimeout(snapshotTimer);
        }
      };
    }

    let eventSource: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let fallbackDelayTimer: ReturnType<typeof setTimeout> | null = null;
    let connectTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
    let streamOpened = false;

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const startPolling = () => {
      if (pollTimer) {
        return;
      }

      void fetchProgress();
      pollTimer = setInterval(() => {
        void fetchProgress();
      }, 2500);
    };

    const clearFallbackTimers = () => {
      if (fallbackDelayTimer) {
        clearTimeout(fallbackDelayTimer);
        fallbackDelayTimer = null;
      }
      if (connectTimeoutTimer) {
        clearTimeout(connectTimeoutTimer);
        connectTimeoutTimer = null;
      }
    };

    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
      startPolling();
      return () => {
        if (snapshotTimer) {
          clearTimeout(snapshotTimer);
        }
        stopPolling();
        clearFallbackTimers();
      };
    }

    eventSource = new window.EventSource(getTaskProgressStreamUrl(task.id), {
      withCredentials: true,
    });

    const onStreamReady = () => {
      streamOpened = true;
      clearFallbackTimers();
      stopPolling();
    };

    const onStreamProgress = (event: MessageEvent<string>) => {
      onStreamReady();
      handleStreamMessage(event.data);
    };

    eventSource.addEventListener('open', onStreamReady);
    eventSource.addEventListener(TASK_PROGRESS_STREAM_EVENT, onStreamProgress as EventListener);
    eventSource.onmessage = onStreamProgress;
    eventSource.onerror = () => {
      if (!streamOpened) {
        startPolling();
        return;
      }

      if (fallbackDelayTimer) {
        clearTimeout(fallbackDelayTimer);
      }

      fallbackDelayTimer = setTimeout(() => {
        startPolling();
      }, 8000);
    };

    connectTimeoutTimer = setTimeout(() => {
      if (!streamOpened) {
        startPolling();
      }
    }, 5000);

    return () => {
      if (snapshotTimer) {
        clearTimeout(snapshotTimer);
      }
      clearFallbackTimers();
      stopPolling();
      eventSource?.close();
    };
  }, [effectiveStatus, task.id]);

  const handleAction = async (actionFn: (id: string) => void | Promise<void>, id: string) => {
    setActionLoading(true);
    try {
      await actionFn(id);
    } catch {
      // Ignored: Toasted by parent
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusDisplay = (status: Task['status']) => {
    switch (status) {
      case 'running':
        return {
          label: '运行中',
          colorClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
          icon: <Bot className="w-4 h-4 text-blue-500 animate-pulse" />
        };
      case 'success':
        return {
          label: '成功',
          colorClass: 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400 border-green-100 dark:border-green-900/30',
          icon: <CheckCircle2 className="w-4 h-4 text-green-500" />
        };
      case 'partial_success':
        return {
          label: '部分成功',
          colorClass: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/30',
          icon: <AlertCircle className="w-4 h-4 text-yellow-500" />
        };
      case 'failed':
        return {
          label: '失败',
          colorClass: 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border-red-100 dark:border-red-900/30',
          icon: <XCircle className="w-4 h-4 text-red-500" />
        };
      case 'stopping':
        return {
          label: '停止中',
          colorClass: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/30',
          icon: <Hourglass className="w-4 h-4 text-yellow-500 animate-spin" />
        };
      case 'stopped':
        return {
          label: '已停止',
          colorClass: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
          icon: <Square className="w-4 h-4 text-gray-400" />
        };
      default:
        return {
          label: '待执行',
          colorClass: 'bg-gray-50 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400 border-gray-100 dark:border-gray-700/50',
          icon: <Clock className="w-4 h-4 text-gray-400" />
        };
    }
  };

  const statusInfo = getStatusDisplay(effectiveStatus);
  const snapshotStatuses: Task['status'][] = ['running', 'stopping', 'success', 'partial_success', 'failed'];
  const stoppableStatuses: Task['status'][] = ['pending', 'running', 'stopping'];
  const totalUnits = progress?.totalUnits ?? 0;
  const completedUnits = progress?.completedUnits ?? 0;
  const derivedPercent = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
  const progressFallback = getProgressFallback(effectiveStatus, progress?.percent ?? 0);
  const fallbackPercent = progressFallback.percent;
  const percent = Math.max(0, Math.min(100, Math.round(totalUnits > 0 ? derivedPercent : fallbackPercent)));
  const showProgress = progress && snapshotStatuses.includes(effectiveStatus);
  const progressCourseLabel = progress?.currentCourse || progressFallback.course;
  const progressChapterLabel = progress?.currentChapter || progressFallback.chapter;
  const taskErrorMessage = progressErrorMessage || task.errorMessage || (effectiveStatus === 'failed' ? progress?.message : '');
  const canStopTask = stoppableStatuses.includes(task.status) || stoppableStatuses.includes(effectiveStatus);
  const isStoppingTask = task.status === 'stopping' || effectiveStatus === 'stopping';

  const coursesCustom = task.configSnapshot?.coursesCustom;
  const doChapterTest = coursesCustom?.doChapterTest ?? true;
  const doWork = coursesCustom?.doWork ?? false;
  const doExam = coursesCustom?.doExam ?? true;
  const workAutoSubmitValue = coursesCustom?.workAutoSubmit;
  const examAutoSubmitValue = coursesCustom?.examAutoSubmit;
  const workAutoSubmitLabel = getAutoSubmitLabel(workAutoSubmitValue);
  const examAutoSubmitLabel = getAutoSubmitLabel(examAutoSubmitValue);
  const includeCourses = coursesCustom?.includeCourses || [];
  const displayCourses = includeCourses.map((courseIdentifier) => {
    const normalizedIdentifier = courseIdentifier.trim();
    const mappedName = courseNameByIdentifier[normalizedIdentifier];

    if (mappedName) {
      return mappedName;
    }

    return /^\d+$/.test(normalizedIdentifier) ? '未匹配课程' : courseIdentifier;
  });

  return (
    <div className="p-3 sm:p-4 flex flex-col gap-4 bg-card border border-border rounded-lg shadow-sm hover:bg-muted/10 transition-colors duration-200 min-w-0 w-full overflow-hidden">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 min-w-0 w-full">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground font-medium min-w-0">
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] shrink-0">
              #{task.id.substring(0, 8)}
            </span>
            <span className="shrink-0">•</span>
            <div className="flex items-center gap-1 min-w-0 max-w-full">
              <UserIcon className="w-3 h-3 text-muted-foreground/70 shrink-0" />
              <span className="truncate max-w-[min(12rem,100%)] font-mono text-[10.5px]">
                {task.configSnapshot?.account || '未知'}
              </span>
            </div>
          </div>
          
          {/* Targeted Courses list */}
          <div className="mt-1 flex flex-wrap gap-1 items-center min-w-0 w-full">
            {displayCourses.length === 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-medium bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20 dark:text-primary-foreground/90">
                <BookOpen className="w-3 h-3 shrink-0" />
                所有课程
              </span>
            ) : (
              displayCourses.map((courseName, i) => (
                <span 
                  key={i} 
                  className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-medium bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] dark:bg-[#8ab4f8]/15 dark:text-[#8ab4f8] dark:border-[#8ab4f8]/25 max-w-full sm:max-w-[140px] min-w-0"
                  title={courseName}
                >
                  <span className="truncate min-w-0">{courseName}</span>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Status Badge with custom styling */}
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border shrink-0 self-start whitespace-nowrap ${statusInfo.colorClass}`}>
          {statusInfo.icon}
          <span>{statusInfo.label}</span>
        </div>
      </div>

      {/* Error Message Box */}
      {taskErrorMessage && (
        <div className="p-3 bg-red-50/70 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded text-xs text-red-600 dark:text-red-400 leading-relaxed flex gap-2 min-w-0 w-full">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <div className="wrap-anywhere font-sans min-w-0">
            <span className="font-semibold block mb-0.5">任务执行异常</span>
            {taskErrorMessage}
          </div>
        </div>
      )}

      {/* Progress Box (real-time data) */}
      {showProgress && (
        <div className="bg-muted/30 dark:bg-[#161719] border border-border/50 rounded-md p-3.5 space-y-3.5 min-w-0 w-full overflow-hidden">
          <div className="flex items-start justify-between gap-2 text-xs">
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-1 font-semibold text-foreground min-w-0" title={progressCourseLabel}>
                {effectiveStatus === 'running' && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5 shrink-0 animate-pulse"></span>
                )}
                <span className="truncate">{progressCourseLabel}</span>
              </div>
              <div className="text-[11px] text-muted-foreground truncate" title={progressChapterLabel}>
                {progressChapterLabel}
              </div>
            </div>
            <span className="font-bold text-sm text-primary dark:text-primary-foreground shrink-0">{percent}%</span>
          </div>

          <div className="space-y-1.5">
            <Progress value={percent} className="h-1.5 bg-muted rounded overflow-hidden" />
            
            <div className="flex flex-wrap justify-between items-center gap-x-3 gap-y-1 text-[10.5px] text-muted-foreground">
              <span className="shrink-0">任务点详情</span>
              <span className="font-medium font-mono text-foreground bg-muted/80 dark:bg-muted/40 px-1.5 py-0.2 rounded max-w-full wrap-anywhere">
                已完成 {completedUnits} / 总计 {totalUnits}
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Date & Time details */}
      <div className="text-[10.5px] text-muted-foreground flex flex-col gap-1 px-1 font-mono">
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 min-w-0">
          <span className="shrink-0">启动时间:</span>
          <span className="text-right wrap-anywhere">{task.startedAt ? formatDateTime(task.startedAt) : '未启动'}</span>
        </div>
        {task.stoppedAt && (
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 min-w-0">
            <span className="shrink-0">结束时间:</span>
            <span className="text-right wrap-anywhere">{formatDateTime(task.stoppedAt)}</span>
          </div>
        )}
      </div>

      {/* Settings Snapshot (Collapsible) */}
      {showConfig && (
        <div className="mt-1 p-3 bg-muted/20 dark:bg-[#161719]/40 border border-border/50 rounded-md text-[11px] text-muted-foreground space-y-2 min-w-0 w-full">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground pb-1 border-b border-border/50">
            <Settings2 className="w-3 h-3 text-muted-foreground" />
            <span>任务配置详情</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 font-sans">
            <div className="flex justify-between gap-2 min-w-0">
              <span>章节测试:</span>
              <span className={`font-semibold ${doChapterTest ? 'text-green-600' : 'text-gray-400'}`}>
                {doChapterTest ? '开启' : '关闭'}
              </span>
            </div>
            <div className="flex justify-between gap-2 min-w-0">
              <span>课程作业:</span>
              <span className={`font-semibold ${doWork ? 'text-green-600' : 'text-gray-400'}`}>
                {doWork ? '开启' : '关闭'}
              </span>
            </div>
            <div className="flex justify-between gap-2 min-w-0">
              <span>课程考试:</span>
              <span className={`font-semibold ${doExam ? 'text-green-600' : 'text-gray-400'}`}>
                {doExam ? '开启' : '关闭'}
              </span>
            </div>
            <div className="flex justify-between gap-2 min-w-0">
              <span>作业提交:</span>
              <span className={`font-semibold ${workAutoSubmitValue ? 'text-green-600' : 'text-gray-400'}`}>
                {workAutoSubmitLabel}
              </span>
            </div>
            <div className="flex justify-between gap-2 min-w-0">
              <span>考试提交:</span>
              <span className={`font-semibold ${examAutoSubmitValue ? 'text-green-600' : 'text-gray-400'}`}>
                {examAutoSubmitLabel}
              </span>
            </div>
            <div className="flex justify-between gap-2 min-w-0">
              <span>答题模式:</span>
              <span className="font-semibold text-foreground text-right wrap-anywhere">
                {coursesCustom?.answerMode === 'xxt' ? '学习通内置' : (coursesCustom?.answerMode || '默认')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Card Action Footer */}
      <div className="flex flex-wrap items-center justify-between border-t border-border/40 pt-3 mt-1 gap-2 min-w-0 w-full">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowConfig(!showConfig)}
          className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-muted px-3 flex items-center gap-1.5 transition-colors shrink-0"
        >
          {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          配置参数
        </Button>
        
        {canStopTask && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              disabled={isStoppingTask || actionLoading}
              onClick={() => handleAction(onStopTask, task.id)}
              className="h-8 px-4 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {actionLoading || isStoppingTask ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Square className="w-3.5 h-3.5 fill-current" />
              )}
              {isStoppingTask ? '停止中' : '停止'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
