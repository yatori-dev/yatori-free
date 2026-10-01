import { Clock3, Eye, SlidersHorizontal } from 'lucide-react';
import type { CourseSummary, StudyIncrement } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface StudyGoalsPageProps {
  courses: CourseSummary[];
  studyIncrements: Record<string, StudyIncrement>;
  defaultStudyIncrement: StudyIncrement;
  onOpenStudyIncrementSettings: (courseKey: string) => void;
}

function formatGoal(increment: StudyIncrement) {
  const values = [
    increment.visitCount ? `学习 ${increment.visitCount} 次` : null,
    increment.videoStudyMinutes
      ? `视频 ${increment.videoStudyMinutes} 分钟`
      : null,
    increment.readMinutes ? `阅读 ${increment.readMinutes} 分钟` : null,
  ].filter(Boolean);
  return values.length > 0 ? values.join(' · ') : '未设置目标';
}

export function StudyGoalsPage({
  courses,
  studyIncrements,
  defaultStudyIncrement,
  onOpenStudyIncrementSettings,
}: StudyGoalsPageProps) {
  return (
    <section className="min-w-0" aria-label="学习目标">
      <div className="border-b border-border pb-4">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Clock3 className="h-4 w-4 text-primary" />
          学习目标
        </h2>
      </div>
      <div>
        <div className="divide-y divide-border">
          {courses.map((course) => {
            const increment =
              studyIncrements[course.key] ?? defaultStudyIncrement;
            const hasGoal = Boolean(
              increment.visitCount ||
                increment.videoStudyMinutes ||
                increment.readMinutes,
            );
            return (
              <div
                key={course.key}
                className="flex items-center gap-3 py-4"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="hidden size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex">
                    {increment.videoStudyMinutes || increment.readMinutes ? (
                      <Clock3 className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-medium text-foreground">
                      {course.courseName}
                    </h3>
                    <p
                      className={`mt-1 break-words text-xs ${hasGoal ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      {formatGoal(increment)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant={hasGoal ? 'secondary' : 'outline'}
                  size="sm"
                  className="shrink-0 gap-1.5"
                  disabled={course.processing === true}
                  onClick={() => onOpenStudyIncrementSettings(course.key)}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {hasGoal ? '调整' : '设置'}
                </Button>
              </div>
            );
          })}
          {courses.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              暂无课程
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
