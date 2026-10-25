import type { TaskProgress } from '@/lib/api';
import { getTaskProgressBreakdown } from '@/lib/taskProgressPresentation';
import { AlertCircle } from 'lucide-react';

interface TaskProgressPanelProps {
  progress: TaskProgress;
}

export function TaskProgressPanel({
  progress,
}: TaskProgressPanelProps) {
  const breakdown = getTaskProgressBreakdown(progress);
  const hasIssues =
    breakdown.failedCategories.length > 0 ||
    breakdown.unresolvedCategories.length > 0 ||
    breakdown.unfinished > 0;

  if (!hasIssues) {
    return null;
  }

  return (
    <div className="w-full min-w-0 space-y-3 border-t border-border pt-4">
      {breakdown.failedCategories.length > 0 && (
        <div className="flex items-start gap-1.5 text-xs text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            失败：
            {breakdown.failedCategories
              .map(({ label, count }) => `${label} ${count} 个`)
              .join('、')}
          </span>
        </div>
      )}
      {breakdown.unresolvedCategories.length > 0 && (
        <div className="flex items-start gap-1.5 text-xs text-warning">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            待确认：
            {breakdown.unresolvedCategories
              .map(({ label, count }) => `${label} ${count} 个`)
              .join('、')}
          </span>
        </div>
      )}
      {breakdown.unfinished > 0 && (
        <div className="flex items-start gap-1.5 text-xs text-warning">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            学习通未完成章节任务点 {breakdown.unfinished} 个
          </span>
        </div>
      )}
    </div>
  );
}
