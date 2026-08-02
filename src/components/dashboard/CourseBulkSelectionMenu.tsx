import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Minus, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CourseBulkSelectionMenuProps {
  allSelected: boolean;
  allSelectionIndeterminate: boolean;
  incompleteAvailable: boolean;
  incompleteSelected: boolean;
  onToggleAll: () => void;
  onToggleIncomplete: () => void;
}

export function CourseBulkSelectionMenu({
  allSelected,
  allSelectionIndeterminate,
  incompleteAvailable,
  incompleteSelected,
  onToggleAll,
  onToggleIncomplete,
}: CourseBulkSelectionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const menuItemClassName = 'flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div ref={rootRef} className="relative">
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="sm"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
          event.preventDefault();
          setOpen(true);
        }}
        className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold shadow-none"
      >
        <ListChecks className="h-4 w-4" aria-hidden="true" />
        批量选择
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </Button>

      {open && (
        <div
          role="menu"
          aria-label="课程批量选择"
          className="absolute left-0 top-[calc(100%+0.375rem)] z-50 w-56 rounded-xl border border-border/70 bg-popover p-1.5 text-popover-foreground shadow-floating"
        >
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={allSelectionIndeterminate ? 'mixed' : allSelected}
            onClick={onToggleAll}
            className={menuItemClassName}
          >
            <span className="flex size-4 shrink-0 items-center justify-center text-primary">
              {allSelected ? <Check className="h-4 w-4" aria-hidden="true" /> : allSelectionIndeterminate ? <Minus className="h-4 w-4" aria-hidden="true" /> : null}
            </span>
            <span>所有课程</span>
          </button>
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={incompleteSelected}
            disabled={!incompleteAvailable}
            onClick={onToggleIncomplete}
            className={menuItemClassName}
          >
            <span className="flex size-4 shrink-0 items-center justify-center text-primary">
              {incompleteSelected && <Check className="h-4 w-4" aria-hidden="true" />}
            </span>
            <span>任务点未完成</span>
          </button>
        </div>
      )}
    </div>
  );
}
