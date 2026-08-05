import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Moon, AlertTriangle } from 'lucide-react';

interface NightTaskConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const NightTaskConfirmDialog: React.FC<NightTaskConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 font-semibold text-warning">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-container text-warning">
              <Moon className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base">夜间时段提交提示</DialogTitle>
          </div>
          <DialogDescription className="mt-2 text-sm text-muted-foreground leading-relaxed">
            当前处于夜间时段（<span className="font-semibold tabular-nums text-foreground">23:00 - 07:00</span>），执行任务可能会被学习通打回进度
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning-container/40 p-3 text-xs text-foreground/80">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
          <span>请确认是否继续提交任务（如无紧急需求，建议在白天正常时段运行）</span>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 text-xs font-medium"
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
            className="h-9 bg-warning text-white hover:bg-warning/90 px-4 text-xs font-semibold shadow-xs"
          >
            仍要提交
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
