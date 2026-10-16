import { useMemo } from 'react';
import {
  AlertCircle,
  CheckSquare,
  GraduationCap,
  RefreshCw,
  Square,
} from 'lucide-react';
import type { CourseDetails, CourseExamItem, CourseSummary } from '@/lib/api';
import { getExamItemTitle } from '@/lib/api';
import {
  formatLocalDateTime,
  getDeadlineUrgencyLabel,
  hasDeadlinePassed,
} from '@/lib/format';
import {
  isCourseEnded,
} from '@/lib/coursePresentation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { CourseCheckbox } from './CourseCheckbox';
import { SubmitModeControl, type SubmitMode } from './SubmitModeControl';
import { ResourceListLoading } from './ResourceListLoading';
import { RedoCountBlock } from './RedoCountBlock';

interface ExamsListSectionProps {
  courses: CourseSummary[];
  coursesLoading: boolean;
  listError?: string | null;
  courseDetailsMap: Record<string, CourseDetails>;
  selectedExams: Record<string, Set<string>>;
  showDeadlineBadges: boolean;
  hideUnavailable: boolean;
  submitMode: SubmitMode;
  onToggleSelectExam: (classId: string, examId: string) => void;
  onToggleSelectCourseExams: (classId: string) => void;
  onRefreshCourses: () => void;
  onSubmitModeChange: (value: SubmitMode) => void;
}

function getVisibleExams(exams: CourseExamItem[], hideUnavailable: boolean) {
  return exams.filter(
    (exam) =>
      !hasDeadlinePassed(exam.endAt) && (!hideUnavailable || exam.runnable),
  );
}

export function ExamsListSection({
  courses,
  coursesLoading,
  listError,
  courseDetailsMap,
  selectedExams,
  showDeadlineBadges,
  hideUnavailable,
  submitMode,
  onToggleSelectExam,
  onToggleSelectCourseExams,
  onRefreshCourses,
  onSubmitModeChange,
}: ExamsListSectionProps) {
  const totalExamsCount = useMemo(() => {
    let totalExamsCount = 0;

    courses.forEach((course) => {
      if (isCourseEnded(course)) return;
      const details = courseDetailsMap[course.key];
      const allExams = details?.exams ?? [];
      const exams = getVisibleExams(allExams, hideUnavailable);
      totalExamsCount += exams.length;
    });

    return totalExamsCount;
  }, [courses, courseDetailsMap, hideUnavailable]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (isCourseEnded(course)) return false;
      const details = courseDetailsMap[course.key];
      return (
        !details || Boolean(details.examsError) ||
        getVisibleExams(details.exams ?? [], hideUnavailable).length > 0
      );
    });
  }, [courses, courseDetailsMap, hideUnavailable]);

  const hasLoadedDetails = useMemo(() => {
    return courses.some((course) => !isCourseEnded(course) && courseDetailsMap[course.key]?.exams !== undefined);
  }, [courses, courseDetailsMap]);

  return (
    <TabsContent
      forceMount
      value="exams"
      className="m-0 outline-none data-[state=inactive]:hidden lg:min-h-0 lg:flex-1"
    >
      <section className="flex min-w-0 flex-col gap-4" aria-label="考试列表">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex min-w-0 items-center gap-2">
            <GraduationCap className="h-5 w-5 shrink-0 text-primary" />
            <h2 className="text-base font-semibold">
              考试
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <SubmitModeControl
              value={submitMode}
              onChange={onSubmitModeChange}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefreshCourses}
              disabled={coursesLoading}
              className="h-9 w-9 shrink-0 rounded-[var(--radius-md)] hover:bg-muted"
              title="刷新考试"
              aria-label="刷新考试"
            >
              <RefreshCw
                className={`h-4 w-4 ${coursesLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>

        {listError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 text-sm text-danger">
            <span className="min-w-0 break-words">{listError}</span>
            <Button size="sm" variant="outline" onClick={onRefreshCourses} disabled={coursesLoading}>重试</Button>
          </div>
        )}
        <div className="min-w-0">
          {coursesLoading && courses.length === 0 ? (
            <ResourceListLoading label="正在加载考试列表" rows={4} />
          ) : filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8 text-muted-foreground/60 mb-2" />
              <p className="text-sm font-medium">未找到匹配的课程或考试</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hasLoadedDetails && !coursesLoading && !listError && totalExamsCount === 0 && (
                <div className="flex items-start gap-2.5 border-b border-border pb-4 text-sm text-muted-foreground">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      当前暂无可执行考试
                    </p>
                  </div>
                </div>
              )}

              {filteredCourses.map((course) => {
                const details = courseDetailsMap[course.key];
                const isLoading = coursesLoading && courseDetailsMap[course.key]?.exams === undefined;
                const allExams = details?.exams ?? [];
                const exams = getVisibleExams(allExams, hideUnavailable);
                const runnableExams = exams.filter((exam) => exam.runnable);
                const courseSelected =
                  selectedExams[course.key] ?? new Set<string>();

                const isAllCourseExamsSelected =
                  runnableExams.length > 0 &&
                  courseSelected.size === runnableExams.length;
                const isSomeCourseExamsSelected =
                  courseSelected.size > 0 &&
                  courseSelected.size < runnableExams.length;

                return (
                  <div
                    key={course.key}
                    className="min-w-0 border-b border-border pb-4 last:border-0"
                  >
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-2.5 flex-1">
                        {details && runnableExams.length > 0 ? (
                          <CourseCheckbox
                            checked={isAllCourseExamsSelected}
                            indeterminate={isSomeCourseExamsSelected}
                            onChange={() =>
                              onToggleSelectCourseExams(course.key)
                            }
                          />
                        ) : (
                          <div className="w-5 shrink-0" />
                        )}

                        <div
                          className="min-w-0 flex-1 select-none"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="break-words text-sm font-medium text-foreground">
                              {course.courseName}
                            </span>
                            {course.courseTeacher && (
                              <span className="text-xs text-muted-foreground">
                                {course.courseTeacher}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>

                    {
                      <div className="min-w-0">
                        {isLoading ? (
                          <ResourceListLoading label="正在读取考试列表" rows={2} compact />
                        ) : !details ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            <span>考试明细暂未加载</span>
                          </div>
                        ) : details.examsError ? (
                          <div
                            className="flex items-start gap-2 py-4 text-xs text-warning"
                            role="alert"
                          >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>考试读取失败：{details.examsError}</span>
                          </div>
                        ) : allExams.length === 0 ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            <span>该课程暂无考试</span>
                          </div>
                        ) : exams.length === 0 ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            <span>
                              该课程考试均不可执行或已截止 (共 {allExams.length}{' '}
                              项)
                            </span>
                          </div>
                        ) : (
                          <div className="divide-y divide-border">
                            {exams.map((exam) => {
                              const title = getExamItemTitle(exam);
                              const isSelected = courseSelected.has(exam.id);
                              const isRunnable = exam.runnable;
                              const urgencyLabel = showDeadlineBadges
                                ? getDeadlineUrgencyLabel(exam.endAt)
                                : null;
                              return (
                                <button
                                  type="button"
                                  key={exam.id}
                                  onClick={() =>
                                    isRunnable &&
                                    onToggleSelectExam(course.key, exam.id)
                                  }
                                  disabled={!isRunnable}
                                  className={`flex w-full items-start gap-2.5 py-2 text-left text-xs transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isRunnable ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                                >
                                  <div className="mt-0.5 shrink-0">
                                    {isRunnable ? (
                                      isSelected ? (
                                        <CheckSquare className="h-4 w-4 text-primary" />
                                      ) : (
                                        <Square className="h-4 w-4 text-muted-foreground" />
                                      )
                                    ) : (
                                      <Square className="h-4 w-4 text-muted-foreground/40" />
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <span
                                        className="min-w-0 flex-1 break-words text-foreground"
                                        title={title}
                                      >
                                        {title}
                                      </span>
                                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                                        <Badge
                                          variant={
                                            urgencyLabel
                                              ? 'destructive'
                                              : isRunnable
                                                ? 'warning'
                                                : 'secondary'
                                          }
                                          className="shrink-0 text-[10px] font-normal"
                                        >
                                          {urgencyLabel ??
                                            (isRunnable ? '未完成' : exam.openAt && exam.openAt > Date.now() ? '未开放' : '不可执行')}
                                        </Badge>
                                        <RedoCountBlock value={exam.remainingRedoTimes} />
                                      </div>
                                    </div>

                                    {exam.endAt !== undefined && (
                                      <div className="text-[11px] leading-4 text-muted-foreground">
                                        截止时间：
                                        {formatLocalDateTime(exam.endAt, {
                                          includeYear: true,
                                          includeSeconds: false,
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    }
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </TabsContent>
  );
}
