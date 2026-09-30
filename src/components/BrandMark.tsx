import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold tracking-tight text-foreground",
        className,
      )}
      aria-hidden="true"
    >
      Yatori
    </span>
  );
}
