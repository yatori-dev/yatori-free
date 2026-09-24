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
    <Card className="mb-3 rounded-none border-x-0 border-border/60 bg-card/90 shadow-none sm:mb-4 sm:rounded-xl sm:border-x sm:shadow-rest">
      <CardContent className="flex items-center gap-4 px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold tracking-tight text-foreground">学习进度</p>
              <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] font-medium tabular-nums text-muted-foreground">
                {percent}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{completedCount} / {visibleCount} 门已完成</span>
              {incompleteCount > 0 && (
                <span className="inline-flex items-center rounded-full border border-warning/20 bg-warning-container/30 px-1.5 py-0.2 text-[10px] font-medium text-warning sm:hidden">
                  {incompleteCount} 待处理
                </span>
              )}
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted/70 p-px">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-emphasized"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {incompleteCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/25 bg-warning-container/30 px-2.5 py-0.5 text-xs font-medium text-warning">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              {incompleteCount} 待处理
            </span>
          )}
          {activeTaskCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-info/25 bg-info-container/30 px-2.5 py-0.5 text-xs font-medium text-info">
              <span className="h-1.5 w-1.5 rounded-full bg-info" />
              {activeTaskCount} 运行中
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
