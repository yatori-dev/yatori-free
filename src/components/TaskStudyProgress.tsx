import { BookOpen, Clock3, Eye, FileText } from "lucide-react";
import type { CourseStudyProgress, StudyMetricProgress } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { getStudyMetricPercent } from "@/lib/studyProgress";

interface TaskStudyProgressProps {
  courses: CourseStudyProgress[];
}

interface StudyMetricProps {
  icon: typeof Eye;
  label: string;
  metric: StudyMetricProgress;
  unit: string;
}

const STUDY_METRIC_STATUS_LABELS = {
  disabled: "未启用",
  pending: "等待中",
  running: "学习中",
  success: "已完成",
  failed: "未完成",
  skipped: "已跳过",
} satisfies Record<StudyMetricProgress["status"], string>;

function formatValue(value: number, unit: string) {
  return `${value}${unit}`;
}

function formatDelta(value: number, unit: string) {
  return `${value >= 0 ? "+" : ""}${formatValue(value, unit)}`;
}

function isVisibleMetric(metric: StudyMetricProgress) {
  return metric.target > metric.baseline;
}

function getVisibleMetrics(course: CourseStudyProgress) {
  return [
    { icon: Eye, label: "学习次数", metric: course.visitCount, unit: "次" },
    {
      icon: Clock3,
      label: "视频观看时长",
      metric: course.videoStudyMinutes,
      unit: "分钟",
    },
    {
      icon: FileText,
      label: "阅读时长",
      metric: course.readMinutes,
      unit: "分钟",
    },
  ].filter(({ metric }) => isVisibleMetric(metric));
}

function StudyMetric({ icon: Icon, label, metric, unit }: StudyMetricProps) {
  const increment = metric.current - metric.baseline;
  const targetIncrement = metric.target - metric.baseline;
  const statusMessage = ["failed", "skipped"].includes(metric.status)
    ? metric.message.trim()
    : "";
  const percent = getStudyMetricPercent(metric);

  return (
    <div className="min-w-0 space-y-2 py-3">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="flex min-w-0 flex-1 items-center gap-1.5 font-medium text-foreground">
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 whitespace-nowrap text-muted-foreground">
          {STUDY_METRIC_STATUS_LABELS[metric.status]}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
        <span className="font-medium tabular-nums text-foreground">
          已 {formatDelta(increment, unit)}
        </span>
        <span className="tabular-nums text-muted-foreground">
          目标 {formatDelta(targetIncrement, unit)}
        </span>
      </div>
      {percent !== null && <Progress value={percent} className="h-1.5 bg-muted" />}
      <div className="mt-1 text-xs text-muted-foreground tabular-nums wrap-anywhere">
        当前 {metric.current}/{formatValue(metric.target, unit)}
      </div>
      {statusMessage && (
        <p className="mt-1.5 text-xs leading-relaxed text-destructive">
          {statusMessage}
        </p>
      )}
    </div>
  );
}

export function TaskStudyProgress({ courses }: TaskStudyProgressProps) {
  const visibleCourses = courses
    .map((course) => ({ course, metrics: getVisibleMetrics(course) }))
    .filter(({ metrics }) => metrics.length > 0);

  if (visibleCourses.length === 0) {
    return null;
  }

  return (
    <section
      className="space-y-2.5 border-t border-border/60 pt-3"
      aria-label="学习目标进度"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          学习目标进度
        </div>
      </div>
      <div className="divide-y divide-border">
        {visibleCourses.map(({ course, metrics }) => {
          return (
            <div
              key={course.classId}
              className="min-w-0 py-3 first:pt-0 last:pb-0"
            >
              <p
                className="truncate text-xs font-medium text-foreground"
                title={course.courseName}
              >
                {course.courseName}
              </p>
              <div className="mt-1 divide-y divide-border/60">
                {metrics.map(({ icon: Icon, label, metric, unit }) => (
                  <StudyMetric
                    key={label}
                    icon={Icon}
                    label={label}
                    metric={metric}
                    unit={unit}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
