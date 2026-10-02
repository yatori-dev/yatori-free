import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TaskSettingsPanel } from './TaskSettingsPanel';

interface SettingsDialogProps {
  open: boolean;
  bypassDailyStudyLimit: boolean;
  showDeadlineBadges: boolean;
  onOpenChange: (open: boolean) => void;
  onUnauthorized: () => void;
  onSettingSwitch: (
    key: 'bypassDailyStudyLimit' | 'showDeadlineBadges',
    checked: boolean,
  ) => void;
}

export function SettingsDialog({
  open,
  bypassDailyStudyLimit,
  showDeadlineBadges,
  onOpenChange,
  onUnauthorized,
  onSettingSwitch,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[calc(100dvh-2rem-env(safe-area-inset-bottom))] max-h-[42.5rem] w-[calc(100%-2rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3 sm:px-6">
          <DialogHeader>
            <DialogTitle className="text-lg leading-7">设置</DialogTitle>
            <DialogDescription className="sr-only">
              管理任务行为、界面显示和邮件提醒
            </DialogDescription>
          </DialogHeader>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            aria-label="关闭设置"
            onClick={() => onOpenChange(false)}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        <TaskSettingsPanel
          bypassDailyStudyLimit={bypassDailyStudyLimit}
          showDeadlineBadges={showDeadlineBadges}
          onUnauthorized={onUnauthorized}
          onSettingSwitch={onSettingSwitch}
        />
      </DialogContent>
    </Dialog>
  );
}
