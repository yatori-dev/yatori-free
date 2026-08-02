import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type SignLogView = 'time' | 'course';

const VIEW_OPTIONS: Array<{
  label: string;
  value: SignLogView;
}> = [
  { value: 'time', label: '按时间' },
  { value: 'course', label: '按课程' },
];

interface SignLogViewMenuProps {
  onChange: (value: SignLogView) => void;
  value: SignLogView;
}

export function SignLogViewMenu({ onChange, value }: SignLogViewMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = VIEW_OPTIONS.findIndex((option) => option.value === value);
  const selectedOption = VIEW_OPTIONS[selectedIndex];

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
    window.setTimeout(() => optionRefs.current[selectedIndex]?.focus(), 0);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, selectedIndex]);

  const focusOption = (index: number) => {
    const normalizedIndex = (index + VIEW_OPTIONS.length) % VIEW_OPTIONS.length;
    optionRefs.current[normalizedIndex]?.focus();
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
          event.preventDefault();
          setOpen(true);
        }}
        className="h-10 justify-between gap-2 rounded-lg bg-card px-3 text-xs font-medium shadow-none sm:w-32"
      >
        <span className="flex min-w-0 items-center gap-2">
          <ListFilter className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate">{selectedOption.label}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </Button>

      {open && (
        <div
          role="menu"
          aria-label="签到记录视图"
          className="absolute right-0 top-[calc(100%+0.375rem)] z-50 w-48 max-w-[calc(100vw-2rem)] rounded-xl border border-border/70 bg-popover p-1.5 text-popover-foreground shadow-floating"
        >
          <p className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground">记录视图</p>
          {VIEW_OPTIONS.map((option, index) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                ref={(element) => { optionRefs.current[index] = element; }}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    focusOption(index + 1);
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    focusOption(index - 1);
                  } else if (event.key === 'Home') {
                    event.preventDefault();
                    focusOption(0);
                  } else if (event.key === 'End') {
                    event.preventDefault();
                    focusOption(VIEW_OPTIONS.length - 1);
                  } else if (event.key === 'Tab') {
                    setOpen(false);
                  }
                }}
                className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
              >
                <span>{option.label}</span>
                <Check
                  className={`h-4 w-4 shrink-0 text-primary ${selected ? 'opacity-100' : 'opacity-0'}`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
