import { cn } from '@/lib/utils';

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span className={cn('inline-flex items-center font-semibold tracking-tight', className)} aria-hidden="true">
      <span className="text-[var(--google-blue)]">Y</span>
      <span className="text-[var(--google-red)]">a</span>
      <span className="text-[var(--google-yellow)]">t</span>
      <span className="text-[var(--google-blue)]">o</span>
      <span className="text-[var(--google-green)]">r</span>
      <span className="text-[var(--google-red)]">i</span>
    </span>
  );
}
