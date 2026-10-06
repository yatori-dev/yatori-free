import React, { useId, useState } from "react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { getStudyProgressPercents } from "@/lib/studyProgress";
import { formatLocalDateTime } from "@/lib/format";
import {
  Square,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  RefreshCw,
  Hourglass,
  Loader2,
} from "lucide-react";
import {
  getTaskConfigSnapshot,
  getTaskCourseIdentifiers,
  getTaskCoursesCustomSnapshot,
  type Task,
} from "@/lib/api";
import type { TaskProgressSnapshot } from "@/hooks/useTaskProgressPolling";
import {
  getTaskCourseTaskPointProgress,
  type CourseTaskPointProgressMap,
} from "@/lib/taskProgress";
import { InlineError } from "./common/InlineError";
import { TaskCourseBadges } from "./task/TaskCourseBadges";
import { TaskCourseListDialog } from "./task/TaskCourseListDialog";
import { TaskProgressPanel } from "./task/TaskProgressPanel";
import { TaskSettingsSnapshot } from "./task/TaskSettingsSnapshot";
import { getTaskPresentation } from "@/lib/taskPresentation";

interface TaskInlineItemProps {
  task: Task;
  courseNameByIdentifier?: Record<string, string>;
  courseTaskPointProgressByIdentifier?: CourseTaskPointProgressMap;
  snapshot?: TaskProgressSnapshot;
  onStopTask: (taskId: string) => void;
}

function getCompactErrorMessage(message: string) {
  const detail = message.includes(":")
    ? message.slice(message.indexOf(":") + 1)
    : message;
  const meaningfulParts = detail
    .split(/[，,]/)
    .map((part) => part.trim())
    .filter((part) => part && !/(?:^|\s)0\s*(?:门|个|项)(?:$|\s)/.test(part));

  return meaningfulParts.join("，");
}

function getProgressFallback(status: Task["status"], progressPercent = 0) {
  switch (status) {
    case "success":
      return {
        percent: 100,
        course: "已完成",
        chapter: "全部任务已结束",
      };
    case "partial_success":
      return {
        percent: progressPercent,
        course: "部分完成",
        chapter: "部分任务未完成",
      };
    case "waiting_daily_limit":
      return {
        percent: progressPercent,
        course: "等待次日继续",
        chapter: "今日任务点学时已达 1200 分钟",
      };
    case "failed":
      return {
        percent: progressPercent,
        course: "执行失败",
        chapter: "未获得进度",
      };
    default:
      return {
        percent: progressPercent,
        course: "等待中...",
        chapter: "--",
      };
  }
}

function getAutoSubmitLabel(value: 0 | 1 | 2 | undefined) {
  if (value === undefined) {
    return "未记录";
  }

  if (value === 2) {
    return "仅保存不提交";
  }

  if (value === 1) {
    return "直接提交";
  }

  return "仅保存不提交";
}

const VISIBLE_COURSE_COUNT = 3;

export const TaskInlineItem: React.FC<TaskInlineItemProps> = ({
  task,
  courseNameByIdentifier = {},
  courseTaskPointProgressByIdentifier = {},
  snapshot,
  onStopTask,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showCourseList, setShowCourseList] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const detailsId = useId();
  const { status: effectiveStatus, progress, configSnapshot } = getTaskPresentation(task, snapshot);
  const taskConfigSnapshot = getTaskConfigSnapshot(configSnapshot);

  const handleAction = async (
    actionFn: (id: string) => void | Promise<void>,
    id: string,
  ) => {
    setActionLoading(true);
    try {
      await actionFn(id);
    } catch {
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusDisplay = (
    status: Task["status"],
  ): {
    label: string;
    variant: "outline";
    icon: React.ReactNode;
    toneClass: string;
  } => {
    switch (status) {
      case "running":
        return {
          label: "运行中",
          variant: "outline",
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          toneClass: "text-info",
        };
      case "waiting_daily_limit":
        return {
          label: "等待次日继续",
          variant: "outline",
          icon: <Hourglass className="h-3 w-3" />,
          toneClass: "text-warning",
        };
      case "success":
        return {
          label: "已完成",
          variant: "outline",
          icon: <CheckCircle2 className="h-3 w-3" />,
          toneClass: "text-success",
        };
      case "partial_success":
        return {
          label: "部分完成",
          variant: "outline",
          icon: <AlertCircle className="h-3 w-3" />,
          toneClass: "text-warning",
        };
      case "failed":
        return {
          label: "失败",
          variant: "outline",
          icon: <XCircle className="h-3 w-3" />,
          toneClass: "text-danger",
        };
      case "stopping":
        return {
          label: "停止中",
          variant: "outline",
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          toneClass: "text-warning",
        };
      case "stopped":
        return {
          label: "已停止",
          variant: "outline",
          icon: <Square className="h-3 w-3" />,
          toneClass: "text-muted-foreground",
        };
      default:
        return {
          label: "待执行",
          variant: "outline",
          icon: <Clock className="h-3 w-3" />,
          toneClass: "text-muted-foreground",
        };
    }
  };

  const statusInfo = getStatusDisplay(effectiveStatus);
  const snapshotStatuses: Task["status"][] = [
    "running",
    "waiting_daily_limit",
    "stopping",
    "stopped",
    "success",
    "partial_success",
    "failed",
  ];
  const stoppableStatuses: Task["status"][] = [
    "pending",
    "running",
    "waiting_daily_limit",
    "stopping",
  ];
  const hasUnitCounts =
    typeof progress?.totalUnits === "number" &&
    typeof progress?.completedUnits === "number";
  const totalUnits = progress?.totalUnits;
  const completedUnits = progress?.completedUnits;
  const failedUnits = progress?.failedUnits;
  const derivedPercent =
    typeof totalUnits === "number" &&
    typeof completedUnits === "number" &&
    typeof failedUnits === "number" &&
    totalUnits > 0
      ? ((completedUnits + failedUnits) / totalUnits) * 100
      : null;
  const progressFallback = getProgressFallback(effectiveStatus);
  const unitPercent = derivedPercent ?? progressFallback.percent;
  const progressParts = [
    ...(derivedPercent === null ? [] : [unitPercent]),
    ...(progress?.studyProgress
      ? getStudyProgressPercents(progress.studyProgress)
      : []),
  ];
  const calculatedPercent =
    progressParts.length > 0
      ? progressParts.reduce((sum, percent) => sum + percent, 0) /
        progressParts.length
      : progressFallback.percent;
  const rawPercent = effectiveStatus === "success" ? 100 : calculatedPercent;
  const currentPercent = Math.max(0, Math.min(100, Math.round(rawPercent)));
  const showProgress = progress && snapshotStatuses.includes(effectiveStatus);
  const taskErrorMessage =
    snapshot?.errorMessage ||
    task.errorMessage ||
    (effectiveStatus === "failed" ? progress?.message : "");
  const isWorkTask = taskConfigSnapshot?.kind === "works";
  const taskUnitLabel = isWorkTask ? "作业" : "任务点";
  const displayTaskErrorMessage = (taskErrorMessage ?? "").replaceAll(
    "任务点",
    taskUnitLabel,
  );
  const canStopTask =
    stoppableStatuses.includes(task.status) ||
    stoppableStatuses.includes(effectiveStatus);
  const isStoppingTask =
    task.status === "stopping" || effectiveStatus === "stopping";

  const coursesCustom = getTaskCoursesCustomSnapshot(configSnapshot);
  const workAutoSubmitValue = coursesCustom?.workAutoSubmit;
  const examAutoSubmitValue = coursesCustom?.examAutoSubmit;
  const workAutoSubmitLabel = getAutoSubmitLabel(workAutoSubmitValue);
  const examAutoSubmitLabel = getAutoSubmitLabel(examAutoSubmitValue);
  const enabledAutomationLabels = [
    coursesCustom?.doChapterTest ? "章节测试" : null,
    coursesCustom?.doWork ? "作业" : null,
    coursesCustom?.doExam ? "考试" : null,
  ].filter(Boolean) as string[];
  const includeCourses = getTaskCourseIdentifiers(configSnapshot);
  const taskCourseTaskPointProgress = getTaskCourseTaskPointProgress(
    includeCourses,
    courseTaskPointProgressByIdentifier,
  );
  const aggregatedPercent =
    taskCourseTaskPointProgress && taskCourseTaskPointProgress.total > 0
      ? (taskCourseTaskPointProgress.completed /
          taskCourseTaskPointProgress.total) *
        100
      : null;
  const percent =
    aggregatedPercent === null
      ? currentPercent
      : Math.max(0, Math.min(100, Math.round(aggregatedPercent)));
  const hasProgress = effectiveStatus === "success" || derivedPercent !== null || progressParts.length > 0 || aggregatedPercent !== null;
  const studyIncrementSettings =
    coursesCustom?.coursesSettings?.flatMap((setting) => {
      if (!setting.classId || !setting.studyIncrement) {
        return [];
      }
      return [
        { classId: setting.classId, studyIncrement: setting.studyIncrement },
      ];
    }) ?? [];
  const displayCourses = includeCourses?.map((courseIdentifier) => {
    const normalizedIdentifier = courseIdentifier.trim();
    const mappedName = courseNameByIdentifier[normalizedIdentifier];
    if (mappedName) {
      return mappedName;
    }
    return /^\d+$/.test(normalizedIdentifier) ? "未匹配课程" : courseIdentifier;
  });
  const hiddenCourses = displayCourses?.slice(VISIBLE_COURSE_COUNT) ?? [];

  const isTerminal = [
    "success",
    "partial_success",
    "failed",
    "stopped",
  ].includes(effectiveStatus);
  const processedUnits = (completedUnits ?? 0) + (failedUnits ?? 0);
  const terminalSummary = (() => {
    if (effectiveStatus === "success") {
      return hasUnitCounts && totalUnits
        ? `已完成 ${processedUnits} / ${totalUnits} 个${taskUnitLabel}`
        : "任务已完成";
    }
    if (effectiveStatus === "stopped") {
      return hasUnitCounts && totalUnits
        ? `停止前已处理 ${processedUnits} / ${totalUnits} 个${taskUnitLabel}`
        : "任务已停止";
    }

    const unitSummary =
      hasUnitCounts && totalUnits
        ? (failedUnits ?? 0) > 0
          ? `${taskUnitLabel}失败 ${failedUnits} 个`
          : processedUnits >= totalUnits
            ? `${taskUnitLabel}已完成`
            : `已处理 ${processedUnits} / ${totalUnits} 个${taskUnitLabel}`
        : "";
    const compactError = displayTaskErrorMessage
      ? getCompactErrorMessage(displayTaskErrorMessage)
      : "";
    const errorSummary =
      (failedUnits ?? 0) > 0
        ? compactError
            .split("，")
            .filter((part) => {
              const normalizedPart = part.trim();
              return !new RegExp(
                `^${taskUnitLabel}(?:处理)?失败\\s*${failedUnits}\\s*个$`,
              ).test(normalizedPart);
            })
            .join("，")
        : compactError;
    return (
      [unitSummary, errorSummary].filter(Boolean).join("，") ||
      (effectiveStatus === "failed" ? "任务未成功完成" : "部分任务未完成")
    );
  })();

  return (
    <article
      className="@container group flex w-full min-w-0 flex-col gap-3 border-b border-border py-4 sm:py-5"
    >
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 @3xl:grid-cols-[minmax(0,1.4fr)_8rem_minmax(14rem,1fr)_auto] @3xl:items-center @3xl:gap-x-6">
        <div className="min-w-0">
          <div className="mb-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h4 className="text-sm font-semibold">
              {taskConfigSnapshot?.kind === "works" ? "作业" : taskConfigSnapshot?.kind === "exams" ? "考试" : taskConfigSnapshot?.kind === "task_points" ? "章节任务" : "学习任务"}
            </h4>
            <span className="text-xs tabular-nums text-muted-foreground" title={task.id}>#{task.id.substring(0, 8)}</span>
          </div>
          <TaskCourseBadges courses={displayCourses} onShowMore={() => setShowCourseList(true)} />
          {!isTerminal && (progress?.currentTitle || progress?.currentChapter) && <p className="mt-1.5 truncate text-xs text-muted-foreground" title={progress.currentTitle || progress.currentChapter}>{progress.currentTitle || progress.currentChapter}</p>}
          <p className="mt-2 text-xs text-muted-foreground">
            {task.createdAt ? `创建于 ${formatLocalDateTime(task.createdAt)}` : task.startedAt ? `启动于 ${formatLocalDateTime(task.startedAt)}` : "尚未启动"}
          </p>
        </div>
        <span className={`flex min-w-0 items-center gap-1.5 text-xs @3xl:col-start-2 @3xl:row-start-1 ${statusInfo.toneClass}`}>
          {statusInfo.icon}<span>{statusInfo.label}</span>
        </span>
        <div className="min-w-0 space-y-1.5 @3xl:col-start-3 @3xl:row-start-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">{aggregatedPercent !== null ? "课程进度" : "执行进度"}</span>
            <span className="font-medium tabular-nums">{hasProgress ? `${percent}%` : "暂无进度"}</span>
          </div>
          {hasProgress && <Progress value={percent} className="h-1.5 bg-muted" />}
          {hasUnitCounts && <p className="text-xs tabular-nums text-muted-foreground">已处理 {processedUnits} / {totalUnits}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1 self-end @3xl:col-start-4 @3xl:row-start-1 @3xl:self-center">
          <Button size="icon" variant="ghost" onClick={() => setShowDetails(!showDetails)} aria-expanded={showDetails} aria-controls={detailsId} aria-label={showDetails ? "收起任务详情" : "展开任务详情"} title={showDetails ? "收起任务详情" : "展开任务详情"} className="h-9 w-9 text-muted-foreground">
            <ChevronDown className={`h-4 w-4 transition-transform duration-[var(--motion-fast)] motion-reduce:transition-none ${showDetails ? "rotate-180" : ""}`} />
          </Button>
          {canStopTask && <Button size="icon" variant="ghost" disabled={isStoppingTask || actionLoading} onClick={() => handleAction(onStopTask, task.id)} aria-label={isStoppingTask ? "任务停止中" : "停止任务"} title={isStoppingTask ? "任务停止中" : "停止任务"} className="h-9 w-9 text-danger hover:bg-danger-container hover:text-danger">
            {actionLoading || isStoppingTask ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Square className="h-3.5 w-3.5" />}
          </Button>}
        </div>
      </div>

      <TaskCourseListDialog
        courses={hiddenCourses}
        open={showCourseList}
        onOpenChange={setShowCourseList}
      />

      {isTerminal && (
        <div
          className={`flex min-w-0 items-start gap-2 text-xs ${statusInfo.toneClass}`}
        >
          {effectiveStatus === "success" && (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          {effectiveStatus === "failed" && (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {effectiveStatus === "stopped" && (
            <Square className="h-4 w-4 shrink-0" />
          )}
          {effectiveStatus === "partial_success" && (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span className="min-w-0 wrap-anywhere">{terminalSummary}</span>
        </div>
      )}

      {displayTaskErrorMessage && !isTerminal && (
        <InlineError
          title="任务执行异常"
          className="bg-danger-container/40 font-sans"
        >
          {displayTaskErrorMessage}
        </InlineError>
      )}

      <div
        id={detailsId}
        className={`grid transition-[grid-template-rows,opacity] duration-[var(--motion-page)] ease-[var(--ease-emphasized)] motion-reduce:transition-none ${showDetails ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"}`}
        aria-hidden={!showDetails}
        inert={!showDetails}
      >
        <div className="min-h-0 space-y-4 overflow-hidden">
          {showDetails && showProgress && progress && (
            <TaskProgressPanel progress={progress} percent={percent} />
          )}
          {showDetails && (
            <div className="mb-3 space-y-3">
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <div className="flex min-w-0 flex-wrap justify-between gap-x-3 gap-y-0.5">
                  <span className="shrink-0">启动时间</span>
                  <span className="text-right wrap-anywhere">
                    {task.startedAt
                      ? formatLocalDateTime(task.startedAt)
                      : "未启动"}
                  </span>
                </div>
                {task.stoppedAt && (
                  <div className="flex min-w-0 flex-wrap justify-between gap-x-3 gap-y-0.5">
                    <span className="shrink-0">结束时间</span>
                    <span className="text-right wrap-anywhere">
                      {formatLocalDateTime(task.stoppedAt)}
                    </span>
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
            <div className="mt-1 min-w-0 w-full border-t border-border pt-3 text-xs text-muted-foreground">
              任务未保存配置快照
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
