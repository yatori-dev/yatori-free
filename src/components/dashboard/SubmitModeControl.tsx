import { cn } from '@/lib/utils';
import { MotionHighlight } from '@/components/ui/motion-highlight';

export type SubmitMode = 0 | 1 | 2;

interface SubmitModeControlProps {
  value: SubmitMode;
  onChange: (value: SubmitMode) => void;
  className?: string;
}

export function SubmitModeControl({
  value,
  onChange,
  className,
}: SubmitModeControlProps) {
  return (
    <div className={cn('flex shrink-0 items-center gap-1.5 sm:gap-2', className)}>
      <span className="hidden text-xs font-medium text-muted-foreground sm:inline">完成后</span>
      <div
        className="motion-highlight-host relative flex rounded-[var(--radius-md)] bg-muted p-0.5"
        data-motion-segment
        role="group"
        aria-label="完成后的处理方式"
      >
        <MotionHighlight selector='[aria-pressed="true"]' />
        <button
          type="button"
          aria-pressed={value !== 1}
          onClick={() => onChange(0)}
          className={cn(
            'h-8 whitespace-nowrap rounded-[var(--radius-sm)] px-1.5 text-xs font-medium transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] focus-visible:ring-2 focus-visible:ring-ring lg:h-7 lg:px-2',
            value !== 1
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          仅保存
        </button>
        <button
          type="button"
          aria-pressed={value === 1}
          onClick={() => onChange(1)}
          className={cn(
            'h-8 whitespace-nowrap rounded-[var(--radius-sm)] px-1.5 text-xs font-medium transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] focus-visible:ring-2 focus-visible:ring-ring lg:h-7 lg:px-2',
            value === 1
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          自动提交
        </button>
      </div>
    </div>
  );
}
