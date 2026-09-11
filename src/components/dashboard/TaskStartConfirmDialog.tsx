import { AlertTriangle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TaskStartConfirmDialogProps {
  open: boolean;
  summary: string;
  warnings: string[];
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function TaskStartConfirmDialog({ open, summary, warnings, onOpenChange, onConfirm }: TaskStartConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-primary">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container">
              <Play className="h-4 w-4 fill-current" />
            </div>
            <DialogTitle className="text-base">确认开始任务</DialogTitle>
          </div>
          <DialogDescription className="mt-2 text-sm leading-relaxed">
            {summary}
          </DialogDescription>
        </DialogHeader>

        {warnings.length > 0 && (
          <div className="space-y-2 rounded-lg border border-warning/30 bg-warning-container/40 p-3 text-xs text-foreground/80">
            {warnings.map((warning) => (
              <div key={warning} className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="flex-row justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 px-4 text-xs font-medium">
            取消
          </Button>
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
            className="h-9 px-4 text-xs font-semibold"
          >
            确认开始
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
