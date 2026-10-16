import { useMemo } from 'react';
import {
  AlertCircle,
  CheckSquare,
  ClipboardList,
  RefreshCw,
  Square,
} from 'lucide-react';
import type { CourseDetails, CourseSummary, CourseWorkItem } from '@/lib/api';
import { getWorkItemTitle } from '@/lib/api';
import {
  formatLocalDateTime,
  getDeadlineUrgencyLabel,
  hasDeadlinePassed,
} from '@/lib/format';
import {
  isCourseEnded,
  isSubmittedWorkStatus,
} from '@/lib/coursePresentation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { CourseCheckbox } from './CourseCheckbox';
import { SubmitModeControl, type SubmitMode } from './SubmitModeControl';
import { ResourceListLoading } from './ResourceListLoading';
import { RedoCountBlock } from './RedoCountBlock';

interface WorksListSectionProps {
  courses: CourseSummary[];
  coursesLoading: boolean;
  listError?: string | null;
  courseDetailsMap: Record<string, CourseDetails>;
  selectedWorks: Record<string, Set<string>>;
  showDeadlineBadges: boolean;
  hideUnavailable: boolean;
  submitMode: SubmitMode;
  onToggleSelectWork: (classId: string, workId: string) => void;
  onToggleSelectCourseWorks: (classId: string) => void;
  onRefreshCourses: () => void;
  onSubmitModeChange: (value: SubmitMode) => void;
}

function getVisibleWorks(works: CourseWorkItem[], hideUnavailable: boolean) {
  return works.filter(
    (work) =>
      !hasDeadlinePassed(work.endAt) && (!hideUnavailable || work.runnable),
  );
}

export function WorksListSection({
  courses,
  coursesLoading,
  listError,
  courseDetailsMap,
  selectedWorks,
  showDeadlineBadges,
  hideUnavailable,
  submitMode,
  onToggleSelectWork,
  onToggleSelectCourseWorks,
  onRefreshCourses,
  onSubmitModeChange,
}: WorksListSectionProps) {
  const totalWorksCount = useMemo(() => {
    let totalWorksCount = 0;

    courses.forEach((course) => {
      if (isCourseEnded(course)) return;
      const details = courseDetailsMap[course.key];
      const allWorks = details?.works ?? [];
      const works = getVisibleWorks(allWorks, hideUnavailable);
      totalWorksCount += works.length;
    });

    return totalWorksCount;
  }, [courses, courseDetailsMap, hideUnavailable]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (isCourseEnded(course)) return false;
      const details = courseDetailsMap[course.key];
      return (
        !details || Boolean(details.worksError) ||
        getVisibleWorks(details.works ?? [], hideUnavailable).length > 0
      );
    });
  }, [courses, courseDetailsMap, hideUnavailable]);

  const hasLoadedDetails = useMemo(() => {
    return courses.some((course) => !isCourseEnded(course) && courseDetailsMap[course.key]?.works !== undefined);
  }, [courses, courseDetailsMap]);

  return (
    <TabsContent
      forceMount
      value="works"
      className="m-0 outline-none data-[state=inactive]:hidden lg:min-h-0 lg:flex-1"
    >
      <section className="flex min-w-0 flex-col gap-4" aria-label="作业列表">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex min-w-0 items-center gap-2">
            <ClipboardList className="h-5 w-5 shrink-0 text-primary" />
            <h2 className="text-base font-semibold">
              作业
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
              title="刷新作业"
              aria-label="刷新作业"
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
            <ResourceListLoading label="正在加载作业列表" rows={4} />
          ) : filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8 text-muted-foreground/60 mb-2" />
              <p className="text-sm font-medium">未找到匹配的课程或作业</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hasLoadedDetails && !coursesLoading && !listError && totalWorksCount === 0 && (
                <div className="flex items-start gap-2.5 border-b border-border pb-4 text-sm text-muted-foreground">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      当前暂无可执行作业
                    </p>
                  </div>
                </div>
              )}

              {filteredCourses.map((course) => {
                const details = courseDetailsMap[course.key];
                const isLoading = coursesLoading && courseDetailsMap[course.key]?.works === undefined;
                const allWorks = details?.works ?? [];
                const works = getVisibleWorks(allWorks, hideUnavailable);
                const runnableWorks = works.filter((work) => work.runnable);
                const courseSelected =
                  selectedWorks[course.key] ?? new Set<string>();

                const isAllCourseWorksSelected =
                  runnableWorks.length > 0 &&
                  courseSelected.size === runnableWorks.length;
                const isSomeCourseWorksSelected =
                  courseSelected.size > 0 &&
                  courseSelected.size < runnableWorks.length;

                return (
                  <div
                    key={course.key}
                    className="min-w-0 border-b border-border pb-4 last:border-0"
                  >
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-2.5 flex-1">
                        {details && runnableWorks.length > 0 ? (
                          <CourseCheckbox
                            checked={isAllCourseWorksSelected}
                            indeterminate={isSomeCourseWorksSelected}
                            onChange={() =>
                              onToggleSelectCourseWorks(course.key)
                            }
                          />
                        ) : (
                          <div className="w-5 shrink-0" />
                        )}

                        <div className="min-w-0 flex-1 select-none">
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
                          <ResourceListLoading label="正在读取作业列表" rows={2} compact />
                        ) : !details ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            <span>作业明细暂未加载</span>
                          </div>
                        ) : details.worksError ? (
                          <div
                            className="flex items-start gap-2 py-4 text-xs text-warning"
                            role="alert"
                          >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>作业读取失败：{details.worksError}</span>
                          </div>
                        ) : allWorks.length === 0 ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            <span>该课程暂无作业</span>
                          </div>
                        ) : works.length === 0 ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            <span>
                              该课程作业均不可执行或已截止 (共 {allWorks.length}{' '}
                              项)
                            </span>
                          </div>
                        ) : (
                          <div className="divide-y divide-border">
                            {works.map((work) => {
                              const title = getWorkItemTitle(work);
                              const isSelected = courseSelected.has(work.id);
                              const isRunnable = work.runnable;
                              const isSubmitted = isSubmittedWorkStatus(work.status);
                              const urgencyLabel = showDeadlineBadges && !isSubmitted
                                ? getDeadlineUrgencyLabel(work.endAt)
                                : null;
                              return (
                                <button
                                  type="button"
                                  key={work.id}
                                  onClick={() =>
                                    isRunnable &&
                                    onToggleSelectWork(course.key, work.id)
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
                                            (isSubmitted
                                              ? '已交'
                                              : isRunnable
                                                ? '未交'
                                                : work.openAt && work.openAt > Date.now()
                                                  ? '未开放'
                                                  : '不可执行')}
                                        </Badge>
                                        <RedoCountBlock value={work.remainingRedoTimes} />
                                      </div>
                                    </div>

                                    {work.endAt !== undefined && (
                                      <div className="text-[11px] leading-4 text-muted-foreground">
                                        截止时间：
                                        {formatLocalDateTime(work.endAt, {
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
