import { useState } from 'react';
import { Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface StopTaskConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function StopTaskConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: StopTaskConfirmDialogProps) {
  const [confirmed, setConfirmed] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setConfirmed(false);
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-danger">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-container">
              <Square className="h-4 w-4 fill-current" />
            </div>
            <DialogTitle className="text-base">确认停止任务</DialogTitle>
          </div>
          <DialogDescription className="mt-2 text-sm leading-relaxed">
            停止请求发出后，任务会在当前执行步骤结束后停止，已完成的内容不会回退
          </DialogDescription>
        </DialogHeader>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-md)] border border-border p-3 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-0.5 size-4 accent-[var(--color-danger)]"
          />
          <span>我确认停止这项任务</span>
        </label>

        <DialogFooter className="flex-row justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="h-9 px-4 text-xs font-medium">
            取消
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!confirmed}
            onClick={() => {
              handleOpenChange(false);
              onConfirm();
            }}
            className="h-9 px-4 text-xs font-semibold"
          >
            确认停止
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
