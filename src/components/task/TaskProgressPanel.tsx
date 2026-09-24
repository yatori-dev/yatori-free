import { Progress } from '@/components/ui/progress';
import { TaskStudyProgress } from '@/components/TaskStudyProgress';
import type { TaskProgress } from '@/lib/api';

interface TaskProgressPanelProps {
  progress: TaskProgress;
  status: string;
  percent: number;
}

export function TaskProgressPanel({ progress, status, percent }: TaskProgressPanelProps) {
  return (
    <div className="w-full min-w-0 space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5 shadow-xs sm:space-y-4 sm:p-4">
      <div className="flex items-end justify-between gap-3 text-xs">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div key={progress.currentCourse} className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-foreground animate-in fade-in duration-260 ease-in-out" title={progress.currentCourse || '等待中...'}>
            <span className="truncate">{progress.currentCourse || '等待中...'}</span>
          </div>
          {progress.currentChapter && <div className="truncate text-xs text-muted-foreground" title={progress.currentChapter}>{progress.currentChapter}</div>}
        </div>
        <span className="shrink-0 text-base font-bold tabular-nums text-primary sm:text-lg">{percent}%</span>
      </div>
      <div className="space-y-2">
        <Progress value={percent} className={`h-2 overflow-hidden rounded-full bg-muted/70 p-px ${status === 'running' ? 'progress-running' : ''}`} />
        {progress.unresolvedUnits > 0 && <div className="text-xs text-warning">有 {progress.unresolvedUnits} 个任务点无法确认状态</div>}
      </div>
      {progress.studyProgress && <TaskStudyProgress courses={progress.studyProgress} />}
    </div>
  );
}
