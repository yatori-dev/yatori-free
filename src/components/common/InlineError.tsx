import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface InlineErrorProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function InlineError({ title, children, className = '' }: InlineErrorProps) {
  return (
    <div className={`flex w-full min-w-0 gap-2.5 rounded-lg border border-danger/30 bg-danger-container/30 p-3 text-xs leading-relaxed text-danger ${className}`}>
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 wrap-anywhere">
        <span className="mb-0.5 block font-semibold">{title}</span>
        {children}
      </div>
    </div>
  );
}
