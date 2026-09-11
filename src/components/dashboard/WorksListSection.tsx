import { useMemo } from 'react';
import {
  AlertCircle,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FolderSync,
  RefreshCw,
  Square,
  Settings,
} from 'lucide-react';
import type { CourseDetails, CourseSummary, CourseWorkItem } from '@/lib/api';
import { getWorkItemTitle } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { CourseCheckbox } from './CourseCheckbox';

interface WorksListSectionProps {
  courses: CourseSummary[];
  coursesLoading: boolean;
  courseDetailsMap: Record<string, CourseDetails>;
  loadingDetails: Record<string, boolean>;
  selectedWorks: Record<string, Set<string>>;
  expandedCourses: Set<string>;
  hideUnavailable: boolean;
  onToggleExpandCourse: (courseKey: string) => void;
  onToggleSelectWork: (classId: string, workId: string) => void;
  onToggleSelectCourseWorks: (classId: string) => void;
  onToggleSelectAllWorks?: () => void;
  onRefreshCourses: () => void;
  onOpenSettings: () => void;
}

export function WorksListSection({
  courses,
  coursesLoading,
  courseDetailsMap,
  loadingDetails,
  selectedWorks,
  expandedCourses,
  hideUnavailable,
  onToggleExpandCourse,
  onToggleSelectWork,
  onToggleSelectCourseWorks,
  onToggleSelectAllWorks,
  onRefreshCourses,
  onOpenSettings,
}: WorksListSectionProps) {
  const stats = useMemo(() => {
    let totalWorksCount = 0;
    let runnableWorksCount = 0;
    let selectedCount = 0;

    courses.forEach((course) => {
      const details = courseDetailsMap[course.key];
      const allWorks = details?.works ?? [];
      const works = allWorks.filter((work) => !hideUnavailable || work.runnable);
      totalWorksCount += works.length;
      const runnable = works.filter((w) => w.runnable);
      runnableWorksCount += runnable.length;
      const courseSelected = selectedWorks[course.key];
      if (courseSelected) {
        runnable.forEach((w) => {
          if (courseSelected.has(w.id)) {
            selectedCount++;
          }
        });
      }
    });

    return { totalWorksCount, runnableWorksCount, selectedCount };
  }, [courses, courseDetailsMap, selectedWorks, hideUnavailable]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const details = courseDetailsMap[course.key];
      return !details || (details.works ?? []).some((work) => !hideUnavailable || work.runnable);
    });
  }, [courses, courseDetailsMap, hideUnavailable]);

  const hasLoadedDetails = useMemo(() => {
    return courses.some((course) => Boolean(courseDetailsMap[course.key]));
  }, [courses, courseDetailsMap]);

  const isAllSelected = stats.runnableWorksCount > 0 && stats.selectedCount === stats.runnableWorksCount;

  return (
    <TabsContent forceMount value="works" className="m-0 outline-none data-[state=inactive]:hidden lg:min-h-0 lg:flex-1">
      <Card className="rounded-none border-none bg-card py-0 shadow-none ring-0 sm:rounded-xl sm:py-4 sm:shadow-sm lg:flex lg:h-full lg:min-h-0 lg:flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 px-3 py-2.5 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2">
            <ClipboardList className="h-5 w-5 shrink-0 text-primary" />
            <CardTitle className="whitespace-nowrap text-sm font-semibold sm:text-base">作业</CardTitle>
            {stats.totalWorksCount > 0 && (
              <Badge variant="outline" className="hidden text-xs font-normal sm:inline-flex">
                已发现 {stats.totalWorksCount} 个作业{stats.runnableWorksCount > 0 ? `（${stats.runnableWorksCount} 可执行）` : ''}
              </Badge>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {onToggleSelectAllWorks && stats.runnableWorksCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-normal"
                onClick={onToggleSelectAllWorks}
                title={isAllSelected ? '取消全选作业' : '全选所有可执行作业'}
                aria-label={isAllSelected ? '取消全选作业' : '全选所有可执行作业'}
              >
                {isAllSelected ? (
                  <CheckSquare className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Square className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span>{isAllSelected ? '取消全选' : '全选可执行'}</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={onOpenSettings}
              title="作业设置"
              aria-label="作业设置"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>设置</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefreshCourses}
              disabled={coursesLoading}
              className="h-8 w-8 shrink-0 rounded-full hover:bg-muted"
              title="刷新课程"
              aria-label="刷新课程"
            >
              <RefreshCw className={`h-4 w-4 ${coursesLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-3 sm:p-6 overflow-y-auto">
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
                <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground sm:p-4">
                  <FolderSync className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-primary">尚未读取作业明细</p>
                    <p className="text-muted-foreground mt-0.5">
                      展开下方课程卡片即可查看作业明细，或点击右上角刷新课程以同步最新数据。
                    </p>
                  </div>
                </div>
              )}

              {hasLoadedDetails && stats.totalWorksCount === 0 && (
                <div className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-muted/25 p-3 text-xs text-muted-foreground sm:p-4">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">当前暂无可执行作业</p>
                    <p className="mt-0.5 text-muted-foreground">
                      各课程已完成明细检查，暂无需要提交的作业。可点击右上角刷新重试。
                    </p>
                  </div>
                </div>
              )}

              {filteredCourses.map((course) => {
                const details = courseDetailsMap[course.key];
                const isLoading = loadingDetails[course.key] === true;
                const isExpanded = expandedCourses.has(course.key);
                const allWorks = details?.works ?? [];
                const works: CourseWorkItem[] = allWorks.filter((work) => !hideUnavailable || work.runnable);
                const runnableWorks = allWorks.filter((w) => w.runnable);
                const courseSelected = selectedWorks[course.key] ?? new Set<string>();

                const isAllCourseWorksSelected =
                  runnableWorks.length > 0 && courseSelected.size === runnableWorks.length;
                const isSomeCourseWorksSelected =
                  courseSelected.size > 0 && courseSelected.size < runnableWorks.length;

                return (
                  <div
                    key={course.key}
                    className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm transition-colors hover:border-border"
                  >
                    <div className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-muted/20">
                      <div className="flex min-w-0 items-center gap-2.5 flex-1">
                        {details && runnableWorks.length > 0 ? (
                          <CourseCheckbox
                            checked={isAllCourseWorksSelected}
                            indeterminate={isSomeCourseWorksSelected}
                            onChange={() => onToggleSelectCourseWorks(course.key)}
                          />
                        ) : (
                          <div className="w-5 shrink-0" />
                        )}

                        <div
                          className="min-w-0 flex-1 cursor-pointer select-none"
                          onClick={() => onToggleExpandCourse(course.key)}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-foreground text-sm truncate">
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
                          <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>加载中</span>
                          </Badge>
                        ) : details ? (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              runnableWorks.length > 0
                                ? 'border-primary/30 bg-primary/10 text-primary'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {allWorks.length === 0
                              ? '无作业'
                              : runnableWorks.length === 0
                                ? `暂无可执行 (${allWorks.length})`
                                : `${runnableWorks.length} 可执行 / 共 ${allWorks.length} 个`}
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleExpandCourse(course.key)}
                            className="h-7 text-xs text-primary"
                          >
                            加载作业
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onToggleExpandCourse(course.key)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          aria-label={isExpanded ? '收起作业明细' : '展开作业明细'}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border/50 p-3 sm:p-4 bg-card">
                        {isLoading ? (
                          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                            <span>正在读取作业列表...</span>
                          </div>
                        ) : !details ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            <span>点击上方按钮加载作业明细</span>
                          </div>
                        ) : allWorks.length === 0 ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            <span>该课程暂无作业</span>
                          </div>
                        ) : works.length === 0 ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            <span>该课程作业均不可执行或已截止 (共 {allWorks.length} 项)</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {works.map((work) => {
                              const title = getWorkItemTitle(work);
                              const isSelected = courseSelected.has(work.id);
                              const isRunnable = work.runnable;

                              return (
                                <div
                                  key={work.id}
                                  onClick={() => {
                                    if (isRunnable) {
                                      onToggleSelectWork(course.key, work.id);
                                    }
                                  }}
                                  className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs transition-colors ${
                                    isSelected
                                      ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                                      : 'border-border/60 bg-muted/20 hover:bg-muted/40'
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
                                    <div className="flex items-start justify-between gap-2">
                                      <span
                                        className="font-medium text-foreground line-clamp-2"
                                        title={title}
                                      >
                                        {title}
                                      </span>
                                      <Badge
                                        className={`shrink-0 border text-[10px] font-normal ${
                                          isRunnable
                                            ? 'border-success/20 bg-success-container text-success'
                                            : 'border-border bg-muted text-muted-foreground'
                                        }`}
                                      >
                                        {isRunnable ? '可执行' : '不可执行'}
                                      </Badge>
                                    </div>

                                    {(work.status !== undefined || work.endDate) && (
                                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                                        {work.status !== undefined && (
                                          <span>状态: {String(work.status)}</span>
                                        )}
                                        {work.endDate && <span>截止: {String(work.endDate)}</span>}
                                        {work.score !== undefined && (
                                          <span>成绩: {String(work.score)}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
