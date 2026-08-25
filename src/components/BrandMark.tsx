import { cn } from '@/lib/utils';

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span className={cn('inline-flex items-center font-semibold tracking-tight text-brand', className)} aria-hidden="true">
      Yatori
    </span>
  );
}
