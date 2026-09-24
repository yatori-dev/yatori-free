import { Clock3, Eye, SlidersHorizontal } from 'lucide-react';
import type { CourseSummary, StudyIncrement } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StudyGoalsPageProps {
  courses: CourseSummary[];
  studyIncrements: Record<string, StudyIncrement>;
  defaultStudyIncrement: StudyIncrement;
  onOpenStudyIncrementSettings: (courseKey: string) => void;
}

function formatGoal(increment: StudyIncrement) {
  const values = [
    increment.visitCount ? `学习 ${increment.visitCount} 次` : null,
    increment.videoStudyMinutes ? `视频 ${increment.videoStudyMinutes} 分钟` : null,
    increment.readMinutes ? `阅读 ${increment.readMinutes} 分钟` : null,
  ].filter(Boolean);
  return values.length > 0 ? values.join(' · ') : '未设置目标';
}

export function StudyGoalsPage({ courses, studyIncrements, defaultStudyIncrement, onOpenStudyIncrementSettings }: StudyGoalsPageProps) {
  return (
    <Card className="rounded-none border-none bg-card py-0 shadow-none ring-0 sm:rounded-xl sm:py-4 sm:shadow-sm">
      <CardHeader className="border-b border-border/50 px-3 py-3 sm:px-6 sm:py-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold sm:text-base">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          学习目标
        </CardTitle>
        <CardDescription className="text-xs">为需要刷学习数据的课程设置学习次数和时长</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {courses.map((course) => {
            const increment = studyIncrements[course.key] ?? defaultStudyIncrement;
            const hasGoal = Boolean(increment.visitCount || increment.videoStudyMinutes || increment.readMinutes);
            return (
              <div key={course.key} className="flex items-center gap-3 px-3 py-4 sm:px-6">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="hidden size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex">
                    {increment.videoStudyMinutes || increment.readMinutes ? <Clock3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-foreground">{course.courseName}</h3>
                    <p className={`mt-1 truncate text-xs ${hasGoal ? 'text-primary' : 'text-muted-foreground'}`}>{formatGoal(increment)}</p>
                  </div>
                </div>
                <Button type="button" variant={hasGoal ? 'secondary' : 'outline'} size="sm" className="shrink-0 gap-1.5" disabled={course.processing === true} onClick={() => onOpenStudyIncrementSettings(course.key)}>
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {hasGoal ? '调整' : '设置'}
                </Button>
              </div>
            );
          })}
          {courses.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">暂无课程</div>}
        </div>
      </CardContent>
    </Card>
  );
}
