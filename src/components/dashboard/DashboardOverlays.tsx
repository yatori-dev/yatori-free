import { Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoutConfirmDialog } from './LogoutConfirmDialog';
import { TaskStartConfirmDialog } from './TaskStartConfirmDialog';
import { SettingsDialog } from './SettingsDialog';
import type { SettingSwitchKey } from './TaskSettingsPanel';

interface DashboardOverlaysProps {
  selectedCount: number;
  creatingTask: boolean;
  estimatedTaskDuration: string | null;
  submitButtonText?: string;
  taskStartConfirmOpen: boolean;
  taskStartSummary: string;
  taskStartWarnings: string[];
  logoutConfirmOpen: boolean;
  settingsDialogOpen: boolean;
  bypassDailyStudyLimit: boolean;
  showDeadlineBadges: boolean;
  autoSubmitWorksNearDeadline: boolean;
  accelerateBeforeCourseEnd: boolean;
  onCreateTask: () => void;
  onTaskStartConfirmChange: (open: boolean) => void;
  onLogoutConfirmChange: (open: boolean) => void;
  onSettingsDialogChange: (open: boolean) => void;
  onSettingSwitch: (key: SettingSwitchKey, checked: boolean) => void;
  onExecuteSubmitTask: () => void;
  onLogout: () => void;
}

export function DashboardOverlays({
  selectedCount,
  creatingTask,
  estimatedTaskDuration,
  submitButtonText,
  taskStartConfirmOpen,
  taskStartSummary,
  taskStartWarnings,
  logoutConfirmOpen,
  settingsDialogOpen,
  bypassDailyStudyLimit,
  showDeadlineBadges,
  autoSubmitWorksNearDeadline,
  accelerateBeforeCourseEnd,
  onCreateTask,
  onTaskStartConfirmChange,
  onLogoutConfirmChange,
  onSettingsDialogChange,
  onSettingSwitch,
  onExecuteSubmitTask,
  onLogout,
}: DashboardOverlaysProps) {
  return (
    <>
      {selectedCount > 0 && (
        <div className="absolute bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-1/2 lg:bottom-6">
          <div className="motion-content-enter flex flex-col items-center gap-1">
            <Button
              type="button"
              onClick={onCreateTask}
              disabled={creatingTask}
              className="h-auto min-h-11 max-w-[calc(100vw-2rem)] shrink-0 gap-0.5 rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-floating hover:bg-primary-hover"
              title={submitButtonText ?? `提交 ${selectedCount} 项任务`}
              aria-label={submitButtonText ?? `提交 ${selectedCount} 项任务`}
            >
              <span className="flex min-w-0 max-w-full items-center gap-2">
                {creatingTask ? (
                  <RefreshCw
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                )}
                <span className="min-w-0 truncate">{submitButtonText ?? `提交任务(${selectedCount})`}</span>
              </span>
            </Button>
            {estimatedTaskDuration && (
              <span
                className="whitespace-nowrap rounded-[var(--radius-md)] bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                role="status"
              >
                预计所需{estimatedTaskDuration}
              </span>
            )}
          </div>
        </div>
      )}
      <TaskStartConfirmDialog
        open={taskStartConfirmOpen}
        summary={taskStartSummary}
        warnings={taskStartWarnings}
        onOpenChange={onTaskStartConfirmChange}
        onConfirm={onExecuteSubmitTask}
      />
      <LogoutConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={onLogoutConfirmChange}
        onConfirm={onLogout}
      />
      <SettingsDialog
        open={settingsDialogOpen}
        bypassDailyStudyLimit={bypassDailyStudyLimit}
        showDeadlineBadges={showDeadlineBadges}
        autoSubmitWorksNearDeadline={autoSubmitWorksNearDeadline}
        accelerateBeforeCourseEnd={accelerateBeforeCourseEnd}
        onOpenChange={onSettingsDialogChange}
        onUnauthorized={onLogout}
        onSettingSwitch={onSettingSwitch}
      />
    </>
  );
}
