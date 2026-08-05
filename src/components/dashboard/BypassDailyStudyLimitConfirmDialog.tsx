import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface BypassDailyStudyLimitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const BypassDailyStudyLimitConfirmDialog: React.FC<BypassDailyStudyLimitConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <div className="flex items-center gap-2.5 font-semibold text-warning">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-container text-warning">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle className="text-base">确认开启暴力模式</DialogTitle>
        </div>
        <DialogDescription className="mt-2 text-sm leading-relaxed">
          此模式会绕过学时限制开始高并发学习，很大概率会被学习通检测到并打回进度。请仅在十分紧急的情况下启用！
        </DialogDescription>
      </DialogHeader>

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 px-4 text-xs font-medium">
          取消
        </Button>
        <Button
          type="button"
          onClick={() => {
            onOpenChange(false);
            onConfirm();
          }}
          className="h-9 bg-warning px-4 text-xs font-semibold text-white shadow-xs hover:bg-warning/90"
        >
          确认
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
