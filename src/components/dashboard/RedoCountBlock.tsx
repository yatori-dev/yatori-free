import { getRemainingRedoCount } from '@/lib/coursePresentation';

interface RedoCountBlockProps {
  value?: number | null;
}

export function RedoCountBlock({ value }: RedoCountBlockProps) {
  const count = getRemainingRedoCount(value);
  if (count === null) return null;

  return (
    <span
      className="inline-flex shrink-0 items-center text-[11px] text-muted-foreground"
      aria-label={`剩余可重做 ${count} 次`}
      title={`剩余可重做 ${count} 次`}
    >
      可重做 {count} 次
    </span>
  );
}
