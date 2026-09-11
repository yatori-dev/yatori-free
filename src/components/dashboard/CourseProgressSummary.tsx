import { Card, CardContent } from '@/components/ui/card';

interface CourseProgressSummaryProps {
  visibleCount: number;
  incompleteCount: number;
  activeTaskCount: number;
}

export function CourseProgressSummary({ visibleCount, incompleteCount, activeTaskCount }: CourseProgressSummaryProps) {
  const completedCount = Math.max(visibleCount - incompleteCount, 0);
  const percent = visibleCount ? Math.round((completedCount / visibleCount) * 100) : 0;

  return (
    <Card className="mb-3 rounded-none border-x-0 bg-card/80 shadow-none sm:mb-4 sm:rounded-xl sm:border-x sm:shadow-rest">
      <CardContent className="flex items-center gap-4 px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">学习进度</p>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{completedCount} / {visibleCount} 门已完成</span>
              {incompleteCount > 0 && <span className="text-[11px] font-medium text-warning sm:hidden">({incompleteCount} 待处理)</span>}
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-3 text-xs sm:flex">
          <span className="text-warning">{incompleteCount} 待处理</span>
          <span className="text-info">{activeTaskCount} 运行中</span>
        </div>
      </CardContent>
    </Card>
  );
}
