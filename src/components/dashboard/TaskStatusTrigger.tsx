import type { ComponentProps } from 'react';
import { Activity } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskStatusTriggerProps extends Omit<ComponentProps<typeof Button>, 'children'> {
  activeTaskCount: number;
}

export function TaskStatusTrigger({ activeTaskCount, className, ...props }: TaskStatusTriggerProps) {
  const hasActiveTasks = activeTaskCount > 0;

  return (
    <Button
      variant="ghost"
      className={cn(
        'hidden h-9 shrink-0 gap-2 rounded-md px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground lg:inline-flex',
        className,
      )}
      aria-label={hasActiveTasks ? `打开任务抽屉，${activeTaskCount} 项进行中` : '打开任务抽屉'}
      title="任务"
      {...props}
    >
      <Activity className="h-4 w-4" />
      <span>任务</span>
      {hasActiveTasks && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-xs font-bold leading-none text-primary-foreground">
          {activeTaskCount}
        </span>
      )}
    </Button>
  );
}
