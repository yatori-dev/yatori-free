import React, { useState } from 'react';
import { Button } from './ui/button';
import { getStudyProgressPercents } from '@/lib/studyProgress';
import { formatLocalDateTime } from '@/lib/format';
import { 
  Square, 
  Bot, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  ChevronDown, 
  RefreshCw, 
  Hourglass,
} from 'lucide-react';
import { getTaskConfigSnapshot, getTaskCourseIdentifiers, getTaskCoursesCustomSnapshot, type Task } from '@/lib/api';
import type { TaskProgressSnapshot } from '@/hooks/useTaskProgressPolling';
import { getTaskCourseTaskPointProgress, type CourseTaskPointProgressMap } from '@/lib/taskProgress';
import { InlineError } from './common/InlineError';
import { TaskCourseBadges } from './task/TaskCourseBadges';
import { TaskCourseListDialog } from './task/TaskCourseListDialog';
import { TaskProgressPanel } from './task/TaskProgressPanel';
import { TaskSettingsSnapshot } from './task/TaskSettingsSnapshot';

interface TaskInlineItemProps {
  task: Task;
  courseNameByIdentifier?: Record<string, string>;
  courseTaskPointProgressByIdentifier?: CourseTaskPointProgressMap;
  snapshot?: TaskProgressSnapshot;
  onStopTask: (taskId: string) => void;
}

function getCompactErrorMessage(message: string) {
  const detail = message.includes(':') ? message.slice(message.indexOf(':') + 1) : message;
  const meaningfulParts = detail
    .split(/[，,]/)
    .map((part) => part.trim())
    .filter((part) => part && !/(?:^|\s)0\s*(?:门|个|项)(?:$|\s)/.test(part));

  return meaningfulParts.join('，');
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
    case 'waiting_daily_limit':
      return {
        percent: progressPercent,
        course: '等待次日继续',
        chapter: '今日任务点学时已达 1200 分钟',
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
    return '仅保存不提交';
  }

  if (value === 1) {
    return '直接提交';
  }

  return '仅保存不提交';
}

const VISIBLE_COURSE_COUNT = 3;

export const TaskInlineItem: React.FC<TaskInlineItemProps> = ({ task, courseNameByIdentifier = {}, courseTaskPointProgressByIdentifier = {}, snapshot, onStopTask }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showCourseList, setShowCourseList] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const taskProgress = task.progress ?? null;
  const configSnapshot = snapshot?.configSnapshot ?? task.configSnapshot;
  const taskConfigSnapshot = getTaskConfigSnapshot(configSnapshot);
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
          colorClass: 'bg-info-container/50 text-info border-info/25 shadow-xs',
          icon: (
            <span className="relative flex h-3.5 w-3.5 items-center justify-center">
              <span className="absolute inline-flex h-2 w-2 rounded-full bg-info/40" />
              <Bot className="relative w-3.5 h-3.5 text-info" />
            </span>
          )
        };
      case 'waiting_daily_limit':
        return {
          label: '等待次日继续',
          colorClass: 'bg-warning-container/50 text-warning border-warning/25 shadow-xs',
          icon: <Hourglass className="w-3.5 h-3.5 text-warning" />
        };
      case 'success':
        return {
          label: '成功',
          colorClass: 'bg-success-container/50 text-success border-success/25 shadow-xs',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-success" />
        };
      case 'partial_success':
        return {
          label: '部分成功',
          colorClass: 'bg-warning-container/50 text-warning border-warning/25 shadow-xs',
          icon: <AlertCircle className="w-3.5 h-3.5 text-warning" />
        };
      case 'failed':
        return {
          label: '失败',
          colorClass: 'bg-danger-container/50 text-danger border-danger/25 shadow-xs',
          icon: <XCircle className="w-3.5 h-3.5 text-danger" />
        };
      case 'stopping':
        return {
          label: '停止中',
          colorClass: 'bg-warning-container/50 text-warning border-warning/25 shadow-xs',
          icon: <Hourglass className="w-3.5 h-3.5 text-warning animate-spin" />
        };
      case 'stopped':
        return {
          label: '已停止',
          colorClass: 'bg-muted/70 text-muted-foreground border-border/70 shadow-xs',
          icon: <Square className="w-3.5 h-3.5 text-muted-foreground" />
        };
      default:
        return {
          label: '待执行',
          colorClass: 'bg-muted/50 text-muted-foreground border-border/50 shadow-xs',
          icon: <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        };
    }
  };

  const statusInfo = getStatusDisplay(effectiveStatus);
  const snapshotStatuses: Task['status'][] = ['running', 'waiting_daily_limit', 'stopping', 'stopped', 'success', 'partial_success', 'failed'];
  const stoppableStatuses: Task['status'][] = ['pending', 'running', 'waiting_daily_limit', 'stopping'];
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
  const currentPercent = Math.max(0, Math.min(100, Math.round(rawPercent)));
  const showProgress = progress && snapshotStatuses.includes(effectiveStatus);
  const taskErrorMessage = snapshot?.errorMessage || task.errorMessage || (effectiveStatus === 'failed' ? progress?.message : '');
  const isWorkTask = taskConfigSnapshot?.kind === 'works';
  const taskUnitLabel = isWorkTask ? '作业' : '任务点';
  const displayTaskErrorMessage = (taskErrorMessage ?? '').replaceAll('任务点', taskUnitLabel);
  const canStopTask = stoppableStatuses.includes(task.status) || stoppableStatuses.includes(effectiveStatus);
  const isStoppingTask = task.status === 'stopping' || effectiveStatus === 'stopping';

  const coursesCustom = getTaskCoursesCustomSnapshot(configSnapshot);
  const workAutoSubmitValue = coursesCustom?.workAutoSubmit;
  const examAutoSubmitValue = coursesCustom?.examAutoSubmit;
  const workAutoSubmitLabel = getAutoSubmitLabel(workAutoSubmitValue);
  const examAutoSubmitLabel = getAutoSubmitLabel(examAutoSubmitValue);
  const enabledAutomationLabels = [
    coursesCustom?.doChapterTest ? '章节测试' : null,
    coursesCustom?.doWork ? '作业' : null,
    coursesCustom?.doExam ? '考试' : null,
  ].filter(Boolean) as string[];
  const includeCourses = getTaskCourseIdentifiers(configSnapshot);
  const taskCourseTaskPointProgress = getTaskCourseTaskPointProgress(
    includeCourses,
    courseTaskPointProgressByIdentifier,
  );
  const aggregatedPercent = taskCourseTaskPointProgress && taskCourseTaskPointProgress.total > 0
    ? (taskCourseTaskPointProgress.completed / taskCourseTaskPointProgress.total) * 100
    : null;
  const percent = aggregatedPercent === null
    ? currentPercent
    : Math.max(0, Math.min(100, Math.round(aggregatedPercent)));
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
  const hiddenCourses = displayCourses?.slice(VISIBLE_COURSE_COUNT) ?? [];

  const isTerminal = ['success', 'partial_success', 'failed', 'stopped'].includes(effectiveStatus);
  const processedUnits = (completedUnits ?? 0) + (failedUnits ?? 0);
  const terminalSummary = (() => {
    if (effectiveStatus === 'success') {
      return hasUnitCounts && totalUnits ? `已完成 ${processedUnits} / ${totalUnits} 个${taskUnitLabel}` : '任务已完成';
    }
    if (effectiveStatus === 'stopped') {
      return hasUnitCounts && totalUnits ? `停止前已处理 ${processedUnits} / ${totalUnits} 个${taskUnitLabel}` : '任务已停止';
    }

    const unitSummary = hasUnitCounts && totalUnits
      ? (failedUnits ?? 0) > 0
        ? `${taskUnitLabel}失败 ${failedUnits} 个`
        : processedUnits >= totalUnits
          ? `${taskUnitLabel}已完成`
          : `已处理 ${processedUnits} / ${totalUnits} 个${taskUnitLabel}`
      : '';
    const compactError = displayTaskErrorMessage ? getCompactErrorMessage(displayTaskErrorMessage) : '';
    const errorSummary = (failedUnits ?? 0) > 0
      ? compactError
          .split('，')
          .filter((part) => !part.startsWith(`${taskUnitLabel}失败`))
          .join('，')
      : compactError;
    return [unitSummary, errorSummary].filter(Boolean).join('，') || (effectiveStatus === 'failed' ? '任务未成功完成' : '部分任务未完成');
  })();

  return (
    <article className={`group flex w-full min-w-0 flex-col gap-3 overflow-hidden rounded-xl border border-border/70 bg-card p-4 shadow-rest transition-[border-color,box-shadow] duration-200 ease-standard hover:border-border hover:shadow-raised sm:gap-4 sm:p-5 ${
      effectiveStatus === 'success' ? 'animate-task-success-flash' : ''
    }`}>
      
      {/* Task Header & Execution Status */}
      <div className="flex w-full min-w-0 flex-col gap-2.5 sm:gap-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="shrink-0 rounded-md border border-border/60 bg-muted/70 px-2 py-0.5 font-semibold text-foreground">
              #{task.id.substring(0, 8)}
            </span>
            {taskConfigSnapshot?.kind && (
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-sans font-medium ${
                taskConfigSnapshot.kind === 'works'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : taskConfigSnapshot.kind === 'exams'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : 'bg-primary/10 text-primary'
              }`}>
                {taskConfigSnapshot.kind === 'works' ? '作业' : taskConfigSnapshot.kind === 'exams' ? '考试' : '章节任务'}
              </span>
            )}
            <span className="hidden sm:inline-block text-muted-foreground/60">•</span>
            <span className="hidden sm:inline-block truncate text-muted-foreground">
              {task.startedAt ? formatLocalDateTime(task.startedAt) : '未启动'}
            </span>
          </div>

          <div className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${statusInfo.colorClass}`}>
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
        </div>

        {/* Targeted Courses Pills */}
        <TaskCourseBadges courses={displayCourses} onShowMore={() => setShowCourseList(true)} />
      </div>

      <TaskCourseListDialog courses={hiddenCourses} open={showCourseList} onOpenChange={setShowCourseList} />

      {/* Terminal result */}
      {isTerminal && (
        <div className={`flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
          effectiveStatus === 'success'
            ? 'border-success/30 bg-success-container/30 text-success'
            : effectiveStatus === 'failed'
              ? 'border-danger/30 bg-danger-container/30 text-danger'
              : effectiveStatus === 'partial_success'
                ? 'border-warning/30 bg-warning-container/30 text-warning'
                : 'border-border/70 bg-muted/30 text-muted-foreground'
        }`}>
          {effectiveStatus === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
          {effectiveStatus === 'failed' && <XCircle className="h-4 w-4 shrink-0" />}
          {effectiveStatus === 'stopped' && <Square className="h-4 w-4 shrink-0" />}
          {effectiveStatus === 'partial_success' && <AlertCircle className="h-4 w-4 shrink-0" />}
          <span className="min-w-0 wrap-anywhere">{terminalSummary}</span>
        </div>
      )}

      {/* Error Message Box */}
      {displayTaskErrorMessage && !isTerminal && (
        <InlineError title="任务执行异常" className="bg-danger-container/40 font-sans">
          {displayTaskErrorMessage}
        </InlineError>
      )}

      {/* Progress Box & Course Switch Cross-fade */}
      {showProgress && !isTerminal && progress && (
        <TaskProgressPanel progress={progress} status={effectiveStatus} percent={percent} />
      )}

      {/* Date & Time details */}
      {!isTerminal && <div className="flex flex-col gap-1 px-1 font-mono text-xs text-muted-foreground">
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 min-w-0">
          <span className="shrink-0">启动时间:</span>
          <span className="text-right wrap-anywhere">{task.startedAt ? formatLocalDateTime(task.startedAt) : '未启动'}</span>
        </div>
        {task.stoppedAt && (
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 min-w-0">
            <span className="shrink-0">结束时间:</span>
            <span className="text-right wrap-anywhere">{formatLocalDateTime(task.stoppedAt)}</span>
          </div>
        )}
      </div>}

      {/* Settings Snapshot (Collapsible Drawer - Secondary) */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-280 ease-emphasized motion-reduce:transition-none ${showDetails ? 'grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0'}`}
        aria-hidden={!showDetails}
      >
        <div className="min-h-0 overflow-hidden">
          {isTerminal && (
            <div className="mb-3 space-y-3">
              <div className="flex flex-col gap-1 px-1 font-mono text-xs text-muted-foreground">
                <div className="flex min-w-0 flex-wrap justify-between gap-x-3 gap-y-0.5">
                  <span className="shrink-0">启动时间</span>
                  <span className="text-right wrap-anywhere">{task.startedAt ? formatLocalDateTime(task.startedAt) : '未启动'}</span>
                </div>
                {task.stoppedAt && (
                  <div className="flex min-w-0 flex-wrap justify-between gap-x-3 gap-y-0.5">
                    <span className="shrink-0">结束时间</span>
                    <span className="text-right wrap-anywhere">{formatLocalDateTime(task.stoppedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {coursesCustom ? (
            <TaskSettingsSnapshot
              config={taskConfigSnapshot}
              coursesCustom={coursesCustom}
              courseNameByIdentifier={courseNameByIdentifier}
              studyIncrementSettings={studyIncrementSettings}
              workAutoSubmitLabel={workAutoSubmitLabel}
              examAutoSubmitLabel={examAutoSubmitLabel}
              enabledAutomationLabels={enabledAutomationLabels}
            />
          ) : (
            <div className="mt-1 min-w-0 w-full rounded-lg border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground">任务未保存配置快照</div>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="mt-0.5 flex w-full min-w-0 flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2.5 sm:pt-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowDetails(!showDetails)}
          aria-expanded={showDetails}
          className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/70 px-3 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-240 ease-standard ${showDetails ? 'rotate-180' : ''}`} />
          <span>{isTerminal ? (showDetails ? '收起详情' : '查看详情') : (showDetails ? '收起参数' : '配置参数')}</span>
        </Button>
        
        {canStopTask && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              disabled={isStoppingTask || actionLoading}
              onClick={() => handleAction(onStopTask, task.id)}
              className="h-8 px-4 border-danger/30 text-danger hover:bg-danger-container/50 hover:border-danger text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
