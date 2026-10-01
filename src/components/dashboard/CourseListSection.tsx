import { useRef, type MouseEvent, type ReactNode } from 'react';
import {
  AlertCircle,
  ChevronDown,
  RefreshCw,
  Search,
  Square,
  X,
} from 'lucide-react';
import type { CourseDetails, CourseSummary } from '@/lib/api';
import { CourseOutline } from './CourseOutline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { CourseCheckbox } from './CourseCheckbox';

interface CourseListSectionProps {
  accountId?: string;
  courses: CourseSummary[];
  filteredCourses: CourseSummary[];
  coursesLoading: boolean;
  coursesError: string | null;
  courseSearch: string;
  courseSearchQuery: string;
  selectedCourses: Set<string>;
  expandedCourses: Set<string>;
  fullyExpandedCourseOutlines: Set<string>;
  courseDetailsMap: Record<string, CourseDetails>;
  loadingDetails: Record<string, boolean>;
  stoppingTaskId: string | null;
  onRefresh: () => void;
  onSearchChange: (value: string) => void;
  onSearchQueryChange: (value: string) => void;
  onToggleCourseSelection: (courseKey: string) => void;
  onStopTask: (taskId: string) => void;
  onToggleExpandCourse: (courseKey: string) => void;
  onToggleFullCourseOutline: (courseKey: string) => void;
}

function formatCourseDate(value?: string) {
  if (!value) return null;
  const isoDate = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (isoDate) return isoDate;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date
        .toLocaleDateString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
        .replaceAll('/', '-');
}

function highlightCourseName(courseName: string, searchTerm: string): ReactNode {
  const query = searchTerm.trim().toLocaleLowerCase();
  if (!query) return courseName;

  const lowerCourseName = courseName.toLocaleLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;

  while (cursor < courseName.length) {
    const matchIndex = lowerCourseName.indexOf(query, cursor);
    if (matchIndex < 0) break;
    if (matchIndex > cursor) {
      parts.push(courseName.slice(cursor, matchIndex));
    }
    parts.push(
      <mark
        key={matchIndex}
        className="rounded-sm bg-primary-container px-0.5 text-foreground"
      >
        {courseName.slice(matchIndex, matchIndex + query.length)}
      </mark>,
    );
    cursor = matchIndex + query.length;
  }

  if (cursor === 0) return courseName;
  if (cursor < courseName.length) parts.push(courseName.slice(cursor));
  return parts;
}

export function CourseListSection({
  accountId,
  courses,
  filteredCourses,
  coursesLoading,
  coursesError,
  courseSearch,
  courseSearchQuery,
  selectedCourses,
  expandedCourses,
  fullyExpandedCourseOutlines,
  courseDetailsMap,
  loadingDetails,
  stoppingTaskId,
  onRefresh,
  onSearchChange,
  onSearchQueryChange,
  onToggleCourseSelection,
  onStopTask,
  onToggleExpandCourse,
  onToggleFullCourseOutline,
}: CourseListSectionProps) {
  const isCourseSearchComposing = useRef(false);

  return (
    <TabsContent
      forceMount
      value="courses"
      className="m-0 outline-none data-[state=inactive]:hidden lg:min-h-0 lg:flex-1"
    >
      <section className="flex min-w-0 flex-col gap-4" aria-label="课程列表">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-1.5 sm:gap-2">
            <div className="group relative min-w-0 flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
              <Input
                type="search"
                value={courseSearch}
                onChange={(event) => {
                  const value = event.target.value;
                  onSearchChange(value);
                  if (!isCourseSearchComposing.current) {
                    onSearchQueryChange(value);
                  }
                }}
                onCompositionStart={() => {
                  isCourseSearchComposing.current = true;
                }}
                onCompositionEnd={(event) => {
                  isCourseSearchComposing.current = false;
                  onSearchQueryChange(event.currentTarget.value);
                }}
                placeholder="搜索课程名称"
                aria-label="搜索课程名称"
                className="course-search-input h-10 bg-background pl-9 pr-9 text-sm shadow-none sm:h-9"
              />
              {courseSearch && (
                <button
                  type="button"
                  onClick={() => {
                    isCourseSearchComposing.current = false;
                    onSearchChange('');
                    onSearchQueryChange('');
                  }}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="清除课程搜索"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {courseSearchQuery.trim() && (
              <span
                className="hidden whitespace-nowrap text-xs text-muted-foreground xl:inline"
                role="status"
              >
                找到 {filteredCourses.length} 门课程
              </span>
            )}
            <Button
              size="icon"
              variant="ghost"
              disabled={coursesLoading}
              onClick={onRefresh}
              className="h-10 w-10 shrink-0 rounded-md hover:bg-muted sm:h-9 sm:w-9"
              title="刷新课程"
              aria-label="刷新课程"
            >
              <RefreshCw
                className={`h-4 w-4 ${coursesLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>
        {courseSearchQuery.trim() && (
          <div className="xl:hidden">
            <span className="text-xs text-muted-foreground" role="status">
              找到 {filteredCourses.length} 门课程
            </span>
          </div>
        )}
        <div className="min-w-0 overflow-hidden rounded-lg border border-border">
          {coursesLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-sm text-muted-foreground">
              <svg className="loading-spinner" viewBox="0 0 50 50">
                <circle
                  className="path"
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  strokeWidth="4"
                />
              </svg>
              <p className="mt-4">拉取课程列表中...</p>
            </div>
          ) : coursesError ? (
            <div className="p-12 text-center font-sans text-sm text-danger">
              <AlertCircle className="mx-auto mb-2 h-8 w-8" />
              {coursesError}
            </div>
          ) : courses.length === 0 ? (
            <div className="p-12 text-center font-sans text-sm text-muted-foreground">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              暂无关联课程，您可以尝试点击右上角刷新重试。
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-12 text-center font-sans text-sm text-muted-foreground">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              {courseSearchQuery.trim()
                ? '没有匹配的课程，请调整搜索条件。'
                : '没有可显示课程，请刷新课程后重试。'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredCourses.map((course) => {
                const jobFinishCount = course.jobFinishCount;
                const jobCount = course.jobCount;
                const hasJobProgress =
                  typeof jobFinishCount === 'number' &&
                  typeof jobCount === 'number';
                const calculatedJobRate =
                  hasJobProgress && jobCount > 0
                    ? Math.round((jobFinishCount / jobCount) * 100)
                    : null;
                const rawJobRate = course.jobRate ?? calculatedJobRate;
                const jobRate =
                  rawJobRate === null
                    ? null
                    : Math.round(Math.max(0, Math.min(100, rawJobRate)));
                const jobProgressLabel = hasJobProgress
                  ? `${jobFinishCount}/${jobCount} (${jobRate ?? 0}%)`
                  : null;
                const isProcessing = course.processing === true;
                const processingTaskLabel = course.processingTaskId
                  ? course.processingTaskId.substring(0, 8)
                  : null;
                const canStopProcessing =
                  isProcessing && Boolean(course.processingTaskId);
                const isStoppingProcessing =
                  course.processingTaskId === stoppingTaskId;
                const isExpanded = expandedCourses.has(course.key);
                const isCourseOutlineFullyExpanded =
                  fullyExpandedCourseOutlines.has(course.key);
                const isSelected = selectedCourses.has(course.key);
                const handleCourseRowClick = (
                  event: MouseEvent<HTMLDivElement>,
                ) => {
                  const target = event.target as HTMLElement;
                  if (target.closest('button, input, a, [role="checkbox"]'))
                    return;
                  onToggleCourseSelection(course.key);
                };

                return (
                  <div
                    key={course.key}
                    className="min-w-0"
                  >
                    <div
                      onClick={handleCourseRowClick}
                      className={`grid cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-4 transition-colors duration-150 sm:gap-x-4 sm:px-4 ${
                        isSelected
                          ? 'bg-muted hover:bg-muted/80'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="contents">
                        {canStopProcessing ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={isStoppingProcessing}
                            onClick={() =>
                              onStopTask(course.processingTaskId as string)
                            }
                            className="size-5 rounded border-danger/40 p-0 text-danger hover:border-danger hover:bg-danger-container/20 max-sm:min-h-5 max-sm:min-w-5"
                            aria-label={
                              isStoppingProcessing ? '停止任务中' : '停止任务'
                            }
                            title={
                              isStoppingProcessing ? '停止任务中' : '停止任务'
                            }
                          >
                            {isStoppingProcessing ? (
                              <RefreshCw className="size-3 animate-spin" />
                            ) : (
                              <Square className="size-3 fill-current" />
                            )}
                          </Button>
                        ) : (
                          <CourseCheckbox
                            checked={isSelected}
                            disabled={isProcessing}
                            indeterminate={false}
                            aria-label={`选择课程：${course.courseName}`}
                            onChange={() => onToggleCourseSelection(course.key)}
                          />
                        )}
                        <button
                          type="button"
                          className="min-w-0 w-full rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => onToggleCourseSelection(course.key)}
                          aria-pressed={isSelected}
                        >
                          <div className="lg:flex lg:min-w-0 lg:items-center lg:gap-6">
                            <div className="min-w-0 lg:w-56 lg:shrink-0 xl:w-64">
                              <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <h3 className="break-words text-sm font-medium text-foreground">
                                  {highlightCourseName(course.courseName, courseSearchQuery)}
                                </h3>
                                {isProcessing && (
                                  <Badge variant="warning">
                                    处理中
                                  </Badge>
                                )}
                              </div>
                              {(course.beginDate || course.endDate) && (
                                <p className="mt-1 break-words text-xs text-muted-foreground">
                                  开课时间：
                                  {formatCourseDate(course.beginDate) ??
                                    '未设置'}
                                  ~
                                  {formatCourseDate(course.endDate) ?? '未设置'}
                                </p>
                              )}
                              {processingTaskLabel && (
                                <span className="mt-1 inline-flex w-fit items-center rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                                  #{processingTaskLabel}
                                </span>
                              )}
                            </div>
                            {jobRate !== null && jobProgressLabel && (
                              <div className="mt-2 grid w-full min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:mt-0">
                                <Progress
                                  value={jobRate}
                                  className={`h-1.5 bg-muted ${isProcessing ? 'progress-running' : ''}`}
                                />
                                <span className="text-xs tabular-nums text-muted-foreground">
                                  {jobProgressLabel}
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      </div>

                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleExpandCourse(course.key)}
                          className={`h-9 w-9 rounded-md p-0 transition-colors duration-150 ${
                            isExpanded
                              ? 'bg-muted text-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                          aria-label={isExpanded ? '收起章节' : '查看章节'}
                          aria-expanded={isExpanded}
                          title={isExpanded ? '收起章节' : '查看章节'}
                        >
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform duration-200 ease-standard ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border/40 bg-muted/20 px-3 pb-3 pl-11 pt-3 sm:px-5 sm:pb-5 sm:pl-12 sm:pt-4 animate-in fade-in-0 duration-240 ease-emphasized">
                        {loadingDetails[course.key] ? (
                          <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                            <svg
                              className="loading-spinner h-4 w-4"
                              viewBox="0 0 50 50"
                            >
                              <circle
                                className="path"
                                cx="25"
                                cy="25"
                                r="20"
                                fill="none"
                                strokeWidth="4"
                              />
                            </svg>
                            <span>正在拉取章节...</span>
                          </div>
                        ) : courseDetailsMap[course.key] ? (
                          <CourseOutline
                            accountId={accountId}
                            courseKey={course.key}
                            courseDetails={courseDetailsMap[course.key]}
                            isFullyExpanded={isCourseOutlineFullyExpanded}
                            onToggleFullOutline={() =>
                              onToggleFullCourseOutline(course.key)
                            }
                          />
                        ) : (
                          <div className="py-2 text-xs text-muted-foreground">
                            无法加载章节。请点击右上角刷新重试。
                          </div>
                        )}
                      </div>
                    )}
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
