import React, { useState } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { TaskStudyProgress } from './TaskStudyProgress';
import { getStudyProgressPercents } from '@/lib/studyProgress';
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
  Settings2,
  Hourglass
} from 'lucide-react';
import { type Task } from '@/lib/api';
import type { TaskProgressSnapshot } from '@/hooks/useTaskProgressPolling';

interface TaskInlineItemProps {
  task: Task;
  courseNameByIdentifier?: Record<string, string>;
  snapshot?: TaskProgressSnapshot;
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
  if (value === undefined) {
    return '未记录';
  }

  if (value === 2) {
    return '模式 2';
  }

  if (value === 1) {
    return '模式 1';
  }

  return '模式 0';
}

export const TaskInlineItem: React.FC<TaskInlineItemProps> = ({ task, courseNameByIdentifier = {}, snapshot, onStopTask }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const taskProgress = task.progress ?? null;
  const snapshotProgress = snapshot?.progress ?? null;
  const progress = (() => {
    if (!snapshotProgress) return taskProgress;
    if (!taskProgress) return snapshotProgress;

    const taskTime = Date.parse(taskProgress.updatedAt ?? '');
    const snapshotTime = Date.parse(snapshotProgress.updatedAt ?? '');
    return Number.isNaN(taskTime) || Number.isNaN(snapshotTime) || snapshotTime >= taskTime
      ? snapshotProgress
      : taskProgress;
  })();

  const taskStatusIsTerminal = ['stopped', 'success', 'partial_success', 'failed'].includes(task.status);
  const polledStatusIsTerminal = snapshot?.status !== undefined
    && ['stopped', 'success', 'partial_success', 'failed'].includes(snapshot.status);
  const effectiveStatus = taskStatusIsTerminal
    ? task.status
    : polledStatusIsTerminal
      ? snapshot.status
      : task.status === 'stopping'
        ? task.status
        : snapshot?.status ?? task.status;

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
  const snapshotStatuses: Task['status'][] = ['running', 'stopping', 'stopped', 'success', 'partial_success', 'failed'];
  const stoppableStatuses: Task['status'][] = ['pending', 'running', 'stopping'];
  const hasUnitCounts = typeof progress?.totalUnits === 'number' && typeof progress?.completedUnits === 'number';
  const totalUnits = progress?.totalUnits;
  const completedUnits = progress?.completedUnits;
  const failedUnits = progress?.failedUnits;
  const derivedPercent = typeof totalUnits === 'number'
    && typeof completedUnits === 'number'
    && typeof failedUnits === 'number'
    && totalUnits > 0
    ? ((completedUnits + failedUnits) / totalUnits) * 100
    : null;
  const successPercent = typeof totalUnits === 'number' && typeof completedUnits === 'number' && totalUnits > 0
    ? (completedUnits / totalUnits) * 100
    : null;
  const progressFallback = getProgressFallback(effectiveStatus);
  const unitPercent = derivedPercent ?? progressFallback.percent;
  const progressParts = [
    ...(derivedPercent === null ? [] : [unitPercent]),
    ...(progress?.studyProgress ? getStudyProgressPercents(progress.studyProgress) : []),
  ];
  const calculatedPercent = progressParts.length > 0
    ? progressParts.reduce((sum, percent) => sum + percent, 0) / progressParts.length
    : progressFallback.percent;
  const rawPercent = effectiveStatus === 'success'
    ? 100
    : calculatedPercent;
  const percent = Math.max(0, Math.min(100, Math.round(rawPercent)));
  const showProgress = progress && snapshotStatuses.includes(effectiveStatus);
  const progressCourseLabel = progress?.currentCourse || progressFallback.course;
  const progressChapterLabel = progress?.currentChapter || (progressFallback.chapter === '--' ? '' : progressFallback.chapter);
  const taskErrorMessage = snapshot?.errorMessage || task.errorMessage || (effectiveStatus === 'failed' ? progress?.message : '');
  const canStopTask = stoppableStatuses.includes(task.status) || stoppableStatuses.includes(effectiveStatus);
  const isStoppingTask = task.status === 'stopping' || effectiveStatus === 'stopping';

  const configSnapshot = task.configSnapshot;
  const coursesCustom = configSnapshot?.coursesCustom;
  const workAutoSubmitValue = coursesCustom?.workAutoSubmit;
  const examAutoSubmitValue = coursesCustom?.examAutoSubmit;
  const workAutoSubmitLabel = getAutoSubmitLabel(workAutoSubmitValue);
  const examAutoSubmitLabel = getAutoSubmitLabel(examAutoSubmitValue);
  const includeCourses = coursesCustom?.includeCourses;
  const studyIncrementSettings = coursesCustom?.coursesSettings?.flatMap((setting) => {
    if (!setting.classId || !setting.studyIncrement) {
      return [];
    }

    return [{ classId: setting.classId, studyIncrement: setting.studyIncrement }];
  }) ?? [];
  const displayCourses = includeCourses?.map((courseIdentifier) => {
    const normalizedIdentifier = courseIdentifier.trim();
    const mappedName = courseNameByIdentifier[normalizedIdentifier];

    if (mappedName) {
      return mappedName;
    }

    return /^\d+$/.test(normalizedIdentifier) ? '未匹配课程' : courseIdentifier;
  });

  return (
    <article className="group flex w-full min-w-0 flex-col gap-2.5 overflow-hidden rounded-lg border border-border/70 bg-card p-3 shadow-sm transition-shadow duration-200 hover:shadow-md sm:gap-4 sm:rounded-xl sm:p-4">
      
      {/* Header Info */}
      <div className="flex w-full min-w-0 flex-col gap-2 sm:gap-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-1 font-mono text-[10px] text-foreground/75">
              #{task.id.substring(0, 8)}
            </span>
          </div>

          {/* Status Badge with custom styling */}
          <div className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs ${statusInfo.colorClass}`}>
          {statusInfo.icon}
          <span>{statusInfo.label}</span>
          </div>
        </div>

        {/* Targeted Courses list */}
        <div className="flex min-w-0 w-full flex-wrap items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {displayCourses === undefined ? (
            <span className="text-xs font-medium text-muted-foreground">课程范围未记录</span>
          ) : displayCourses.length === 0 ? (
            <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium text-primary dark:bg-primary/20">
              未选择课程
            </span>
          ) : (
            displayCourses.map((courseName, i) => (
              <span
                key={i}
                className="inline-flex min-w-0 max-w-full items-center rounded-md border border-primary/15 bg-primary/8 px-2 py-1 text-xs font-medium text-primary dark:bg-primary/15 sm:max-w-[180px]"
                title={courseName}
              >
                <span className="min-w-0 truncate">{courseName}</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Error Message Box */}
      {taskErrorMessage && (
        <div className="flex w-full min-w-0 gap-2 rounded border border-red-100 bg-red-50/70 p-2.5 text-xs leading-relaxed text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 sm:p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <div className="wrap-anywhere font-sans min-w-0">
            <span className="font-semibold block mb-0.5">任务执行异常</span>
            {taskErrorMessage}
          </div>
        </div>
      )}

      {/* Progress Box (real-time data) */}
      {showProgress && (
        <div className="w-full min-w-0 space-y-2.5 overflow-hidden rounded-md border border-border/70 bg-muted/20 p-2.5 dark:bg-muted/10 sm:space-y-3.5 sm:rounded-lg sm:p-3.5">
          <div className="flex items-end justify-between gap-3 text-xs">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-foreground" title={progressCourseLabel}>
                {effectiveStatus === 'running' && (
                  <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-primary"></span>
                )}
                <span className="truncate">{progressCourseLabel}</span>
              </div>
              {progressChapterLabel && (
                <div className="truncate text-xs text-muted-foreground" title={progressChapterLabel}>
                  {progressChapterLabel}
                </div>
              )}
            </div>
            <span className="shrink-0 text-base font-bold tabular-nums text-primary sm:text-lg">{percent}%</span>
          </div>

          <div className="space-y-1.5">
            <Progress
              value={percent}
              className={`h-2 overflow-hidden rounded-full bg-muted ${effectiveStatus === 'running' ? 'progress-running' : ''}`}
            />
            
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="shrink-0 font-medium">任务点详情</span>
              <span className="max-w-full rounded-md bg-muted/80 px-1.5 py-1 font-mono font-medium text-foreground wrap-anywhere dark:bg-muted/40">
                {hasUnitCounts
                  ? `已处理 ${(completedUnits ?? 0) + (failedUnits ?? 0)} / ${totalUnits} · 成功率 ${Math.round(successPercent ?? 0)}%`
                  : '任务点明细未提供'}
              </span>
            </div>
          </div>

          {progress.studyProgress && (
            <TaskStudyProgress courses={progress.studyProgress} />
          )}
        </div>
      )}

      {/* Date & Time details */}
      <div className="flex flex-col gap-0.5 px-1 font-mono text-[11px] text-muted-foreground sm:gap-1 sm:text-xs">
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
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${showConfig ? 'grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0'}`}
        aria-hidden={!showConfig}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-1 min-w-0 w-full space-y-2 rounded-md border border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground dark:bg-[#161719]/40">
          <div className="flex items-center gap-1 border-b border-border/50 pb-1 text-xs font-semibold text-foreground">
            <Settings2 className="w-3 h-3 text-muted-foreground" />
            <span>任务配置详情</span>
          </div>
          {coursesCustom ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 font-sans">
            <div className="flex justify-between gap-2 min-w-0">
              <span>章节测试:</span>
              <span className="font-semibold text-foreground">
                {coursesCustom.doChapterTest === undefined ? '未记录' : coursesCustom.doChapterTest ? '开启' : '关闭'}
              </span>
            </div>
            <div className="flex justify-between gap-2 min-w-0">
              <span>课程作业:</span>
              <span className="font-semibold text-foreground">
                {coursesCustom.doWork === undefined ? '未记录' : coursesCustom.doWork ? '开启' : '关闭'}
              </span>
            </div>
            <div className="flex justify-between gap-2 min-w-0">
              <span>课程考试:</span>
              <span className="font-semibold text-foreground">
                {coursesCustom.doExam === undefined ? '未记录' : coursesCustom.doExam ? '开启' : '关闭'}
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
                {coursesCustom.answerMode ?? '未记录'}
              </span>
            </div>
            {studyIncrementSettings.length > 0 && (
              <div className="col-span-full space-y-1 border-t border-border/50 pt-2">
                <span>学习目标:</span>
                {studyIncrementSettings.map((setting) => {
                  const courseName = courseNameByIdentifier[setting.classId] ?? setting.classId;
                  const increments = [
                    (setting.studyIncrement.visitCount ?? 0) > 0
                      ? `学习次数 +${setting.studyIncrement.visitCount}`
                      : null,
                    (setting.studyIncrement.videoStudyMinutes ?? 0) > 0
                      ? `视频观看 +${setting.studyIncrement.videoStudyMinutes} 分钟`
                      : null,
                    (setting.studyIncrement.readMinutes ?? 0) > 0
                      ? `阅读 +${setting.studyIncrement.readMinutes} 分钟`
                      : null,
                  ].filter(Boolean).join(' · ');
                  return (
                    <div key={setting.classId} className="flex justify-between gap-2 text-foreground">
                      <span className="truncate" title={courseName}>{courseName}</span>
                      <span className="shrink-0 font-semibold tabular-nums">
                        {increments || '未设置'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          ) : (
            <div className="text-xs text-muted-foreground">任务未保存配置快照</div>
          )}
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="mt-0.5 flex w-full min-w-0 flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2 sm:mt-1 sm:pt-3">
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
    </article>
  );
};
