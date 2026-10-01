import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  compact?: boolean;
}

export function BrandMark({ className, compact = false }: BrandMarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-semibold",
        className,
      )}
      aria-hidden="true"
    >
      <span className="text-[var(--google-blue)]">Y</span>
      {!compact && <>
      <span className="text-[var(--google-red)]">a</span>
      <span className="text-[var(--google-yellow)]">t</span>
      <span className="text-[var(--google-blue)]">o</span>
      <span className="text-[var(--google-green)]">r</span>
      <span className="text-[var(--google-red)]">i</span>
      </>}
    </span>
  );
}
