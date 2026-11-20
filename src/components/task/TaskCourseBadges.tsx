import { BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskCourseBadgesProps {
  courses?: string[];
  onShowMore: (showAll?: boolean) => void;
}

export function TaskCourseBadges({
  courses,
  onShowMore,
}: TaskCourseBadgesProps) {
  const visible = courses?.slice(0, 3);
  const hiddenCount = Math.max(0, (courses?.length ?? 0) - 3);
  const mobileExtraCount = Math.max(0, (courses?.length ?? 0) - 1);
  return (
    <div className="flex min-w-0 w-full items-center gap-1.5 sm:flex-wrap">
      <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      {courses === undefined ? (
        <span
          className="text-xs font-medium text-muted-foreground"
          title="任务详情接口未返回课程范围"
        >
          课程范围未返回
        </span>
      ) : courses.length === 0 ? (
        <span className="text-xs text-muted-foreground">
          未选择课程
        </span>
      ) : (
        <>
          {visible?.map((name, index) => (
            <span
              key={`${name}-${index}`}
              title={name}
              className={`min-w-0 truncate text-xs text-foreground sm:max-w-[200px] ${index > 0 ? 'hidden sm:inline' : 'flex-1 sm:flex-none'}`}
            >
              {index > 0 && <span className="mr-1.5 text-muted-foreground" aria-hidden="true">/</span>}{name}
            </span>
          ))}
          {mobileExtraCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onShowMore(true)}
              aria-haspopup="dialog"
              className="h-6 shrink-0 gap-0.5 rounded-[var(--radius-md)] px-2 text-xs font-medium text-muted-foreground hover:text-foreground sm:hidden"
            >
              等 {courses.length} 门<ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {hiddenCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onShowMore(false)}
              aria-haspopup="dialog"
              className="hidden h-6 gap-1 rounded-[var(--radius-md)] px-2 text-xs font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              另 {hiddenCount} 门<ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
