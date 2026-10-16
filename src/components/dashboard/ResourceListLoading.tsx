import type { CSSProperties } from 'react';
import './resource-list-loading.css';

interface ResourceListLoadingProps {
  label: string;
  rows?: number;
  compact?: boolean;
}

export function ResourceListLoading({
  label,
  rows = 3,
  compact = false,
}: ResourceListLoadingProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={compact ? 'py-3' : 'py-6'}
    >
      <div className="resource-list-loading__rows space-y-3" aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            style={{ '--resource-row-index': index } as CSSProperties}
            className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border/70 px-3 py-3"
          >
            <div className="h-4 w-4 shrink-0 rounded-[var(--radius-sm)] bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-3/5 rounded-[var(--radius-sm)] bg-muted" />
              <div className="h-3 w-2/5 rounded-[var(--radius-sm)] bg-muted" />
            </div>
            <div className="h-5 w-16 shrink-0 rounded-[var(--radius-sm)] bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
