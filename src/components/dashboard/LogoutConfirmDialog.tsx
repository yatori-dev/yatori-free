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
import { LogOut } from 'lucide-react';

interface LogoutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <div className="flex items-center gap-2.5 text-foreground">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <LogOut className="h-5 w-5" />
          </div>
          <DialogTitle className="text-base">确认退出账号</DialogTitle>
        </div>
        <DialogDescription className="mt-2 text-sm leading-relaxed">
          退出后需要重新登录才能继续使用学习通服务。
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 px-4 text-xs font-medium">
          取消
        </Button>
        <Button type="button" onClick={onConfirm} className="h-9 px-4 text-xs font-semibold">
          退出账号
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
