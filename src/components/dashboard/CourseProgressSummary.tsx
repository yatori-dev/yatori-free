import { Progress } from '@/components/ui/progress';

interface CourseProgressSummaryProps {
  totalTaskPointCount: number;
  completedTaskPointCount: number;
}

export function CourseProgressSummary({
  totalTaskPointCount,
  completedTaskPointCount,
}: CourseProgressSummaryProps) {
  const percent = totalTaskPointCount
    ? Math.round((completedTaskPointCount / totalTaskPointCount) * 100)
    : 0;

  return (
    <section className="mb-6 border-b border-border pb-5" aria-label="学习进度">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium">学习进度</h2>
        <span className="text-sm font-semibold tabular-nums">{percent}%</span>
      </div>
      <Progress value={percent} className="h-1.5" aria-label="任务点完成进度" />
      <p className="mt-2 text-xs tabular-nums text-muted-foreground">
        {completedTaskPointCount} / {totalTaskPointCount} 个任务点已完成
      </p>
    </section>
  );
}
