import { TaskStudyProgress } from '@/components/TaskStudyProgress';
import type { TaskProgress } from '@/lib/api';
import { AlertCircle } from 'lucide-react';

interface TaskProgressPanelProps {
  progress: TaskProgress;
}

export function TaskProgressPanel({
  progress,
}: TaskProgressPanelProps) {
  if (!(progress.unresolvedUnits > 0) && !progress.studyProgress?.length) {
    return null;
  }

  return (
    <div className="w-full min-w-0 space-y-3 border-t border-border pt-4">
      {progress.unresolvedUnits > 0 && (
        <div className="flex items-start gap-1.5 text-xs text-warning">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          有 {progress.unresolvedUnits} 个任务点无法确认状态
        </div>
      )}
      {progress.studyProgress && (
        <TaskStudyProgress courses={progress.studyProgress} />
      )}
    </div>
  );
}
