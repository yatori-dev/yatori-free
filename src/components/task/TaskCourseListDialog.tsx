import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TaskCourseListDialogProps {
  courses: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskCourseListDialog({
  courses,
  open,
  onOpenChange,
}: TaskCourseListDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem-env(safe-area-inset-bottom))] max-w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-4 py-4 pr-11 sm:px-5 sm:px-6">
          <DialogTitle>其余 {courses.length} 门课程</DialogTitle>
          <DialogDescription className="sr-only">
            本次任务中未在卡片展示的课程
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[min(520px,calc(100dvh-8rem-env(safe-area-inset-bottom)))] overflow-y-auto p-3 sm:p-4">
          <ol className="space-y-1.5">
            {courses.map((courseName, index) => (
              <li
                key={`${courseName}-${index}`}
                className="rounded-[var(--radius-lg)] border border-border bg-muted/25 px-3 py-2 text-sm text-foreground"
              >
                {courseName}
              </li>
            ))}
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
}
