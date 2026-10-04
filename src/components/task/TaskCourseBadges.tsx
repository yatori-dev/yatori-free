import { BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TaskCourseBadgesProps {
  courses?: string[];
  onShowMore: () => void;
}

export function TaskCourseBadges({
  courses,
  onShowMore,
}: TaskCourseBadgesProps) {
  const visible = courses?.slice(0, 3);
  const hiddenCount = Math.max(0, (courses?.length ?? 0) - 3);
  return (
    <div className="flex min-w-0 w-full flex-wrap items-center gap-1.5">
      <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      {courses === undefined ? (
        <span
          className="text-xs font-medium text-muted-foreground"
          title="任务详情接口未返回课程范围"
        >
          课程范围未返回
        </span>
      ) : courses.length === 0 ? (
        <Badge variant="secondary" className="text-xs">
          未选择课程
        </Badge>
      ) : (
        <>
          {visible?.map((name, index) => (
            <Badge
              key={`${name}-${index}`}
              variant="secondary"
              title={name}
              className="min-w-0 max-w-full font-normal sm:max-w-[200px]"
            >
              <span className="truncate">{name}</span>
            </Badge>
          ))}
          {hiddenCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onShowMore}
              aria-haspopup="dialog"
              className="h-6 gap-1 rounded-[var(--radius-md)] px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              另 {hiddenCount} 门<ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
