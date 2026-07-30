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
  Hourglass,
  Layers,
  Sparkles
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

function getCompactErrorMessage(message: string) {
  const detail = message.includes(':') ? message.slice(message.indexOf(':') + 1) : message;
  const meaningfulParts = detail
    .split(/[，,]/)
    .map((part) => part.trim())
    .filter((part) => part && !/\s0\s*(?:门|个|项)$/.test(part));

  return meaningfulParts.join('，') || message;
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

const STAGES = [
  { id: 'queued', label: '排队' },
  { id: 'fetching', label: '拉取课程' },
  { id: 'processing', label: '处理任务点' },
  { id: 'study', label: '学习目标' },
  { id: 'finished', label: '完成' },
];

export const TaskInlineItem: React.FC<TaskInlineItemProps> = ({ task, courseNameByIdentifier = {}, snapshot, onStopTask }) => {
  const [showDetails, setShowDetails] = useState(false);
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
          colorClass: 'bg-info-container/60 text-info border-info/20',
          icon: <Bot className="w-4 h-4 text-info" />
        };
      case 'success':
        return {
          label: '成功',
          colorClass: 'bg-success-container/60 text-success border-success/20',
          icon: <CheckCircle2 className="w-4 h-4 text-success" />
        };
      case 'partial_success':
        return {
          label: '部分成功',
          colorClass: 'bg-warning-container/60 text-warning border-warning/20',
          icon: <AlertCircle className="w-4 h-4 text-warning" />
        };
      case 'failed':
        return {
          label: '失败',
          colorClass: 'bg-danger-container/60 text-danger border-danger/20',
          icon: <XCircle className="w-4 h-4 text-danger" />
        };
      case 'stopping':
        return {
          label: '停止中',
          colorClass: 'bg-warning-container/60 text-warning border-warning/20',
          icon: <Hourglass className="w-4 h-4 text-warning animate-spin" />
        };
      case 'stopped':
        return {
          label: '已停止',
          colorClass: 'bg-muted text-muted-foreground border-border',
          icon: <Square className="w-4 h-4 text-muted-foreground" />
        };
      default:
        return {
          label: '待执行',
          colorClass: 'bg-muted/50 text-muted-foreground border-border/50',
          icon: <Clock className="w-4 h-4 text-muted-foreground" />
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
  const enabledAutomationLabels = [
    coursesCustom?.doChapterTest ? '章节测试' : null,
    coursesCustom?.doWork ? '课程作业' : null,
    coursesCustom?.doExam ? '课程考试' : null,
  ].filter(Boolean) as string[];
  const hasRecordedAutomation = coursesCustom !== undefined && [
    coursesCustom.doChapterTest,
    coursesCustom.doWork,
    coursesCustom.doExam,
  ].some((value) => value !== undefined);
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

  // Calculate current stage index (0..4) for execution trace
  const currentStageIndex = (() => {
    if (['success', 'partial_success', 'failed', 'stopped'].includes(effectiveStatus)) {
      return 4;
    }
    if (effectiveStatus === 'pending') {
      return 0;
    }
    if (progress?.studyProgress && Object.keys(progress.studyProgress).length > 0) {
      return 3;
    }
    if (hasUnitCounts || percent > 0) {
      return 2;
    }
    return 1;
  })();

  const isTerminal = ['success', 'partial_success', 'failed', 'stopped'].includes(effectiveStatus);
  const processedUnits = (completedUnits ?? 0) + (failedUnits ?? 0);
  const terminalSummary = (() => {
    if (effectiveStatus === 'success') {
      return hasUnitCounts && totalUnits ? `已完成 ${processedUnits} / ${totalUnits} 个任务点` : '任务已完成';
    }
    if (effectiveStatus === 'stopped') {
      return hasUnitCounts && totalUnits ? `停止前已处理 ${processedUnits} / ${totalUnits} 个任务点` : '任务已停止';
    }

    const unitSummary = hasUnitCounts && totalUnits
      ? (failedUnits ?? 0) > 0
        ? `任务点失败 ${failedUnits} 个`
        : processedUnits >= totalUnits
          ? '任务点已完成'
          : `已处理 ${processedUnits} / ${totalUnits} 个任务点`
      : '';
    const compactError = taskErrorMessage ? getCompactErrorMessage(taskErrorMessage) : '';
    const errorSummary = (failedUnits ?? 0) > 0
      ? compactError
          .split('，')
          .filter((part) => !part.startsWith('任务点失败'))
          .join('，')
      : compactError;
    return [unitSummary, errorSummary].filter(Boolean).join('，') || (effectiveStatus === 'failed' ? '任务未成功完成' : '部分任务未完成');
  })();

  return (
    <article className={`group flex w-full min-w-0 flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-rest transition-all duration-200 ease-standard hover:shadow-raised dark:hover:bg-accent/10 sm:gap-4 sm:p-5 ${
      effectiveStatus === 'success' ? 'animate-task-success-flash' : ''
    }`}>
      
      {/* Task Header & Execution Status */}
      <div className="flex w-full min-w-0 flex-col gap-2.5 sm:gap-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 font-semibold text-foreground">
              #{task.id.substring(0, 8)}
            </span>
            <span className="hidden sm:inline-block text-muted-foreground/60">•</span>
            <span className="hidden sm:inline-block truncate text-muted-foreground">
              {task.startedAt ? formatDateTime(task.startedAt) : '未启动'}
            </span>
          </div>

          <div className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${statusInfo.colorClass}`}>
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
        </div>

        {/* Targeted Courses Pills */}
        <div className="flex min-w-0 w-full flex-wrap items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {displayCourses === undefined ? (
            <span className="text-xs font-medium text-muted-foreground">课程范围未记录</span>
          ) : displayCourses.length === 0 ? (
            <span className="rounded-md border border-primary/20 bg-primary-container/30 px-2 py-0.5 text-xs font-medium text-primary">
              未选择课程
            </span>
          ) : (
            displayCourses.map((courseName, i) => (
              <span
                key={i}
                className="inline-flex min-w-0 max-w-full items-center rounded-md border border-primary/15 bg-primary-container/20 px-2 py-0.5 text-xs font-medium text-primary sm:max-w-[200px]"
                title={courseName}
              >
                <span className="min-w-0 truncate">{courseName}</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Execution Trace Track (顶部阶段轨迹) */}
      {!isTerminal ? (
        <div className="w-full space-y-2 rounded-xl border border-border/80 bg-muted/20 p-3 sm:p-4">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5 text-foreground font-semibold">
              <Layers className="h-3.5 w-3.5 text-primary" />
              执行轨迹
            </span>
            <span className="tabular-nums font-mono text-xs text-primary font-bold">{percent}%</span>
          </div>

          {/* Smooth Track Bar */}
          <div className="relative my-2 flex items-center justify-between">
            <div className="absolute inset-x-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
            <div
              className="absolute left-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary transition-all duration-500"
              style={{ width: `calc(${(currentStageIndex / (STAGES.length - 1)) * 100}% - 16px)` }}
            />
            {STAGES.map((stg, idx) => {
              const isPassed = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div key={stg.id} className="relative z-10 flex flex-col items-center gap-1">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary-container/50 scale-110'
                        : isPassed
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </div>
                  <span className={`text-xs whitespace-nowrap ${isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {stg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={`flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium ${
          effectiveStatus === 'success'
            ? 'border-success/30 bg-success-container/30 text-success'
            : effectiveStatus === 'failed'
              ? 'border-danger/30 bg-danger-container/30 text-danger'
              : effectiveStatus === 'partial_success'
                ? 'border-warning/30 bg-warning-container/30 text-warning'
                : 'border-border bg-muted/30 text-muted-foreground'
        }`}>
          {effectiveStatus === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
          {effectiveStatus === 'failed' && <XCircle className="h-4 w-4 shrink-0" />}
          {effectiveStatus === 'stopped' && <Square className="h-4 w-4 shrink-0" />}
          {effectiveStatus === 'partial_success' && <AlertCircle className="h-4 w-4 shrink-0" />}
          <span className="min-w-0 wrap-anywhere">{terminalSummary}</span>
        </div>
      )}

      {/* Error Message Box */}
      {taskErrorMessage && !isTerminal && (
        <div className="flex w-full min-w-0 gap-2.5 rounded-lg border border-danger/30 bg-danger-container/40 p-3 text-xs leading-relaxed text-danger">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="wrap-anywhere font-sans min-w-0">
            <span className="font-semibold block mb-0.5">任务执行异常</span>
            {taskErrorMessage}
          </div>
        </div>
      )}

      {/* Progress Box & Course Switch Cross-fade */}
      {showProgress && !isTerminal && (
        <div className="w-full min-w-0 space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3.5 sm:space-y-4 sm:p-4">
          <div className="flex items-end justify-between gap-3 text-xs">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div
                key={progressCourseLabel}
                className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-foreground transition-opacity duration-200 animate-in fade-in"
                title={progressCourseLabel}
              >
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
              <span className="max-w-full rounded-md bg-muted/80 px-2 py-0.5 font-mono text-xs font-medium text-foreground wrap-anywhere">
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
      {!isTerminal && <div className="flex flex-col gap-1 px-1 font-mono text-xs text-muted-foreground">
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
      </div>}

      {/* Settings Snapshot (Collapsible Drawer - Secondary) */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-standard motion-reduce:transition-none ${showDetails ? 'grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0'}`}
        aria-hidden={!showDetails}
      >
        <div className="min-h-0 overflow-hidden">
          {isTerminal && (
            <div className="mb-3 space-y-3">
              {taskErrorMessage && (
                <div className="flex w-full min-w-0 gap-2.5 rounded-lg border border-danger/30 bg-danger-container/30 p-3 text-xs leading-relaxed text-danger">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0 wrap-anywhere">
                    <span className="mb-0.5 block font-semibold">异常详情</span>
                    {taskErrorMessage}
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-1 px-1 font-mono text-xs text-muted-foreground">
                <div className="flex min-w-0 flex-wrap justify-between gap-x-3 gap-y-0.5">
                  <span className="shrink-0">启动时间</span>
                  <span className="text-right wrap-anywhere">{task.startedAt ? formatDateTime(task.startedAt) : '未启动'}</span>
                </div>
                {task.stoppedAt && (
                  <div className="flex min-w-0 flex-wrap justify-between gap-x-3 gap-y-0.5">
                    <span className="shrink-0">结束时间</span>
                    <span className="text-right wrap-anywhere">{formatDateTime(task.stoppedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="mt-1 min-w-0 w-full space-y-3 rounded-lg border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 border-b border-border/50 pb-1.5 text-xs font-semibold text-foreground">
              <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span>任务配置</span>
            </div>
            {coursesCustom ? (
              <div className="space-y-2 font-sans">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <span className="shrink-0">自动答题</span>
                  <span className="text-right font-semibold text-foreground wrap-anywhere">
                    {enabledAutomationLabels.length > 0
                      ? enabledAutomationLabels.join('、')
                      : hasRecordedAutomation
                        ? '未开启'
                        : '未记录'}
                  </span>
                </div>
                {coursesCustom.doWork && (
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <span className="shrink-0">作业提交</span>
                    <span className="text-right font-semibold text-foreground">{workAutoSubmitLabel}</span>
                  </div>
                )}
                {coursesCustom.doExam && (
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <span className="shrink-0">考试提交</span>
                    <span className="text-right font-semibold text-foreground">{examAutoSubmitLabel}</span>
                  </div>
                )}
                {coursesCustom.answerMode && (
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <span className="shrink-0">答题模式</span>
                    <span className="text-right font-semibold text-foreground wrap-anywhere">{coursesCustom.answerMode}</span>
                  </div>
                )}
                {studyIncrementSettings.length > 0 && (
                  <div className="space-y-1.5 border-t border-border/50 pt-2.5">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" />
                      学习目标
                    </span>
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
      <div className="mt-0.5 flex w-full min-w-0 flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2.5 sm:pt-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowDetails(!showDetails)}
          aria-expanded={showDetails}
          className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-muted px-3 flex items-center gap-1.5 transition-colors shrink-0"
        >
          {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {isTerminal ? (showDetails ? '收起详情' : '查看详情') : '配置参数'}
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
