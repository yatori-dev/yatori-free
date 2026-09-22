import { BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskCourseBadgesProps {
  courses?: string[];
  onShowMore: () => void;
}

export function TaskCourseBadges({ courses, onShowMore }: TaskCourseBadgesProps) {
  const visible = courses?.slice(0, 3);
  const hiddenCount = Math.max(0, (courses?.length ?? 0) - 3);
  return (
    <div className="flex min-w-0 w-full flex-wrap items-center gap-1.5">
      <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      {courses === undefined ? <span className="text-xs font-medium text-muted-foreground" title="任务详情接口未返回课程范围">课程范围未返回</span> : courses.length === 0 ? (
        <span className="rounded-md border border-primary/20 bg-primary-container/30 px-2 py-0.5 text-xs font-medium text-primary">未选择课程</span>
      ) : <>
        {visible?.map((name, index) => <span key={`${name}-${index}`} title={name} className="inline-flex min-w-0 max-w-full items-center rounded-md border border-primary/15 bg-primary-container/20 px-2 py-0.5 text-xs font-medium text-primary sm:max-w-[200px]"><span className="min-w-0 truncate">{name}</span></span>)}
        {hiddenCount > 0 && <Button type="button" variant="outline" size="sm" onClick={onShowMore} aria-haspopup="dialog" className="h-7 gap-1 rounded-md border-border bg-muted/60 px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">另 {hiddenCount} 门<ChevronRight className="h-3.5 w-3.5" /></Button>}
      </>}
    </div>
  );
}
