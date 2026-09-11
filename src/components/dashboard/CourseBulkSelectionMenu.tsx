import { useEffect, useRef } from 'react';

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
  onToggleAll,
}: CourseBulkSelectionMenuProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) checkboxRef.current.indeterminate = allSelectionIndeterminate;
  }, [allSelectionIndeterminate]);

  return (
    <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-2.5 text-xs font-semibold transition-colors hover:bg-accent hover:text-accent-foreground focus-within:ring-2 focus-within:ring-ring">
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={allSelected}
        onChange={onToggleAll}
        aria-label="全选课程"
        className="size-4 accent-primary"
      />
      <span>全选</span>
    </label>
  );
}
