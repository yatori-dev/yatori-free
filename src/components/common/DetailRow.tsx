import type { ReactNode } from 'react';

interface DetailRowProps {
  label: string;
  children: ReactNode;
  valueClassName?: string;
}

export function DetailRow({ label, children, valueClassName = '' }: DetailRowProps) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <span className="shrink-0">{label}</span>
      <span className={`text-right font-semibold text-foreground wrap-anywhere ${valueClassName}`}>{children}</span>
    </div>
  );
}
