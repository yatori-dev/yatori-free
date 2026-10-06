import { Progress } from '@/components/ui/progress';
import { TaskStudyProgress } from '@/components/TaskStudyProgress';
import type { TaskProgress } from '@/lib/api';
import { AlertCircle } from 'lucide-react';

interface TaskProgressPanelProps {
  progress: TaskProgress;
  percent: number;
}

export function TaskProgressPanel({
  progress,
  percent,
}: TaskProgressPanelProps) {
  return (
    <div className="w-full min-w-0 space-y-3 border-t border-border pt-4">
      <div className="flex items-end justify-between gap-3 text-xs">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div
            key={progress.currentCourse}
            className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-foreground"
            title={progress.currentCourse || '等待进度更新'}
          >
            <span className="truncate">
              {progress.currentCourse || '等待进度更新'}
            </span>
          </div>
          {progress.currentChapter && (
            <div
              className="truncate text-xs text-muted-foreground"
              title={progress.currentChapter}
            >
              {progress.currentChapter}
            </div>
          )}
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
          {percent}%
        </span>
      </div>
      <div className="space-y-2">
        <Progress
          value={percent}
          className="h-1.5 bg-muted"
        />
        {progress.unresolvedUnits > 0 && (
          <div className="flex items-start gap-1.5 text-xs text-warning">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            有 {progress.unresolvedUnits} 个任务点无法确认状态
          </div>
        )}
      </div>
      <dl className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
        <div className="flex gap-2"><dt className="text-muted-foreground">已完成</dt><dd className="tabular-nums">{progress.completedUnits}</dd></div>
        <div className="flex gap-2"><dt className="text-muted-foreground">失败</dt><dd className="tabular-nums">{progress.failedUnits}</dd></div>
        <div className="flex gap-2"><dt className="text-muted-foreground">总数</dt><dd className="tabular-nums">{progress.totalUnits}</dd></div>
      </dl>
      {progress.studyProgress && (
        <TaskStudyProgress courses={progress.studyProgress} />
      )}
    </div>
  );
}
