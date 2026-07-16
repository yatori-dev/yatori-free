import { BookOpen, Clock3, Eye, Target } from 'lucide-react';
import type { CourseStudyProgress, StudyMetricProgress } from '@/lib/api';

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
  disabled: '未启用',
  pending: '等待中',
  running: '学习中',
  success: '已完成',
  failed: '未完成',
  skipped: '已跳过',
} satisfies Record<StudyMetricProgress['status'], string>;

function formatValue(value: number, unit: string) {
  return `${value}${unit}`;
}

function formatDelta(value: number, unit: string) {
  return `${value >= 0 ? '+' : ''}${formatValue(value, unit)}`;
}

function StudyMetric({ icon: Icon, label, metric, unit }: StudyMetricProps) {
  const increment = metric.current - metric.baseline;
  const targetIncrement = metric.target - metric.baseline;
  const statusMessage = ['failed', 'skipped'].includes(metric.status)
    ? metric.message.trim()
    : '';

  return (
    <div className="rounded-md border border-border/50 bg-card/60 p-2.5">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
          <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
          {label}
        </span>
        <span className="shrink-0 text-muted-foreground">
          {STUDY_METRIC_STATUS_LABELS[metric.status]}
        </span>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          已 {formatDelta(increment, unit)}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[10.5px] text-muted-foreground">
          <Target className="h-3 w-3" />
          {formatDelta(targetIncrement, unit)}
        </span>
      </div>
      <div className="mt-1 text-[10.5px] text-muted-foreground tabular-nums">
        当前 {metric.current}/{formatValue(metric.target, unit)}
      </div>
      {statusMessage && (
        <p className="mt-1.5 text-[10.5px] leading-relaxed text-destructive">
          {statusMessage}
        </p>
      )}
    </div>
  );
}

export function TaskStudyProgress({ courses }: TaskStudyProgressProps) {
  if (courses.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2.5 border-t border-border/60 pt-3" aria-label="学习目标进度">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          学习目标进度
        </div>
      </div>
      <div className="space-y-2">
        {courses.map((course) => (
          <div key={course.classId} className="rounded-lg border border-border/60 bg-card/70 p-2.5">
            <p className="truncate text-[11px] font-medium text-foreground" title={course.courseName}>
              {course.courseName}
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <StudyMetric icon={Eye} label="学习次数" metric={course.visitCount} unit="次" />
              <StudyMetric icon={Clock3} label="学习时长" metric={course.studyMinutes} unit="分钟" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
