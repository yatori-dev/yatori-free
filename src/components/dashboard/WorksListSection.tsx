import { useMemo } from 'react';
import {
  AlertCircle,
  CheckSquare,
  ClipboardList,
  FolderSync,
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { CourseCheckbox } from './CourseCheckbox';
import { SubmitModeControl, type SubmitMode } from './SubmitModeControl';

interface WorksListSectionProps {
  courses: CourseSummary[];
  coursesLoading: boolean;
  courseDetailsMap: Record<string, CourseDetails>;
  loadingDetails: Record<string, boolean>;
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
  courseDetailsMap,
  loadingDetails,
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
      const details = courseDetailsMap[course.key];
      const allWorks = details?.works ?? [];
      const works = getVisibleWorks(allWorks, hideUnavailable);
      totalWorksCount += works.length;
    });

    return totalWorksCount;
  }, [courses, courseDetailsMap, hideUnavailable]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const details = courseDetailsMap[course.key];
      return (
        !details ||
        getVisibleWorks(details.works ?? [], hideUnavailable).length > 0
      );
    });
  }, [courses, courseDetailsMap, hideUnavailable]);

  const hasLoadedDetails = useMemo(() => {
    return courses.some((course) => Boolean(courseDetailsMap[course.key]));
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
              title="刷新课程"
              aria-label="刷新课程"
            >
              <RefreshCw
                className={`h-4 w-4 ${coursesLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>

        <div className="min-w-0">
          {coursesLoading && courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <RefreshCw className="h-7 w-7 animate-spin text-primary/70 mb-3" />
              <p className="text-sm">正在加载课程...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8 text-muted-foreground/60 mb-2" />
              <p className="text-sm font-medium">未找到匹配的课程或作业</p>
            </div>
          ) : (
            <div className="space-y-3">
              {!hasLoadedDetails && (
                <div className="flex items-start gap-2.5 border-b border-border pb-4 text-sm text-foreground">
                  <FolderSync className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-primary">
                      尚未读取作业明细
                    </p>
                  </div>
                </div>
              )}

              {hasLoadedDetails && totalWorksCount === 0 && (
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
                const isLoading = loadingDetails[course.key] === true;
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

                      <div className="flex items-center gap-2 shrink-0">
                        {isLoading ? (
                          <Badge
                            variant="outline"
                            className="text-xs text-muted-foreground gap-1"
                          >
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>加载中</span>
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    {
                      <div className="min-w-0">
                        {isLoading ? (
                          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                            <span>正在读取作业列表...</span>
                          </div>
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
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {works.map((work) => {
                              const title = getWorkItemTitle(work);
                              const isSelected = courseSelected.has(work.id);
                              const isRunnable = work.runnable;
                              const urgencyLabel = showDeadlineBadges
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
                                  aria-pressed={isSelected}
                                  className={`flex min-w-0 items-start gap-2.5 rounded-[var(--radius-lg)] border p-3 text-left text-xs transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                    isSelected
                                      ? 'border-primary bg-muted'
                                      : 'border-border bg-background hover:bg-muted/50'
                                  } ${isRunnable ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                                >
                                  <div className="mt-0.5 shrink-0">
                                    {isRunnable ? (
                                      isSelected ? (
                                        <CheckSquare className="h-4 w-4 text-primary fill-primary/10" />
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
                                        className="min-w-0 flex-1 basis-28 break-words font-medium text-foreground"
                                        title={title}
                                      >
                                        {title}
                                      </span>
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
                                          (isRunnable ? '未交' : '不可执行')}
                                      </Badge>
                                    </div>

                                    <div className="flex min-h-4 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] leading-4 text-muted-foreground">
                                      {work.endAt !== undefined && (
                                        <span>
                                          截止时间：
                                          {formatLocalDateTime(work.endAt, {
                                            includeYear: true,
                                            includeSeconds: false,
                                          })}
                                        </span>
                                      )}
                                    </div>
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
