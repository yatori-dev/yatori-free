import { useRef, type MouseEvent } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { CourseCheckbox } from './CourseCheckbox';
import { CourseBulkSelectionMenu } from './CourseBulkSelectionMenu';

interface CourseListSectionProps {
  accountId?: string;
  courses: CourseSummary[];
  filteredCourses: CourseSummary[];
  coursesLoading: boolean;
  coursesError: string | null;
  courseSearch: string;
  courseSearchQuery: string;
  selectableCourses: CourseSummary[];
  incompleteSelectableCourses: CourseSummary[];
  isAllSelected: boolean;
  isSomeSelected: boolean;
  isAllIncompleteSelected: boolean;
  selectedCourses: Set<string>;
  expandedCourses: Set<string>;
  fullyExpandedCourseOutlines: Set<string>;
  courseDetailsMap: Record<string, CourseDetails>;
  loadingDetails: Record<string, boolean>;
  stoppingTaskId: string | null;
  onRefresh: () => void;
  onSearchChange: (value: string) => void;
  onSearchQueryChange: (value: string) => void;
  onToggleSelectAll: () => void;
  onToggleSelectIncomplete: () => void;
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
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).replaceAll('/', '-');
}

export function CourseListSection({
  accountId,
  courses,
  filteredCourses,
  coursesLoading,
  coursesError,
  courseSearch,
  courseSearchQuery,
  selectableCourses,
  incompleteSelectableCourses,
  isAllSelected,
  isSomeSelected,
  isAllIncompleteSelected,
  selectedCourses,
  expandedCourses,
  fullyExpandedCourseOutlines,
  courseDetailsMap,
  loadingDetails,
  stoppingTaskId,
  onRefresh,
  onSearchChange,
  onSearchQueryChange,
  onToggleSelectAll,
  onToggleSelectIncomplete,
  onToggleCourseSelection,
  onStopTask,
  onToggleExpandCourse,
  onToggleFullCourseOutline,
}: CourseListSectionProps) {
  const isCourseSearchComposing = useRef(false);

  return (
    <TabsContent forceMount value="courses" className="m-0 outline-none data-[state=inactive]:hidden lg:min-h-0 lg:flex-1">
      <Card className="rounded-none border-none bg-card py-0 shadow-none ring-0 sm:rounded-xl sm:py-4 sm:shadow-sm lg:flex lg:h-full lg:min-h-0 lg:flex-col">
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border/50 px-3 py-2 sm:px-6 sm:py-3.5">
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <CardTitle className="hidden whitespace-nowrap text-sm font-semibold sm:block lg:hidden">课程列表</CardTitle>
            {selectableCourses.length > 0 && (
              <CourseBulkSelectionMenu
                allSelected={isAllSelected}
                allSelectionIndeterminate={isSomeSelected && !isAllSelected}
                incompleteAvailable={incompleteSelectableCourses.length > 0}
                incompleteSelected={isAllIncompleteSelected}
                onToggleAll={onToggleSelectAll}
                onToggleIncomplete={onToggleSelectIncomplete}
              />
            )}
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2">
            <div className="group relative min-w-0 flex-1 sm:max-w-xs">
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
                className="course-search-input h-8 rounded-md border-border/80 bg-background/90 pl-9 pr-9 text-[13px] shadow-none transition-all duration-200 placeholder:text-muted-foreground/80 hover:border-primary/40 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10 sm:h-9 sm:rounded-lg sm:pl-10 sm:pr-10 sm:text-sm sm:shadow-sm sm:focus-visible:ring-4"
              />
              {courseSearch && (
                <button
                  type="button"
                  onClick={() => {
                    isCourseSearchComposing.current = false;
                    onSearchChange('');
                    onSearchQueryChange('');
                  }}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="清除课程搜索"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {courseSearchQuery.trim() && (
              <span className="hidden whitespace-nowrap text-xs text-muted-foreground xl:inline" role="status">
                找到 {filteredCourses.length} 门课程
              </span>
            )}
            <Button
              size="icon"
              variant="ghost"
              disabled={coursesLoading}
              onClick={onRefresh}
              className="h-8 w-8 shrink-0 rounded-full hover:bg-muted"
              title="刷新课程"
              aria-label="刷新课程"
            >
              <RefreshCw className={`h-4 w-4 ${coursesLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        {courseSearchQuery.trim() && (
          <div className="border-b border-border/50 px-4 py-2 sm:px-6 xl:hidden">
            <span className="text-xs text-muted-foreground" role="status">
              找到 {filteredCourses.length} 门课程
            </span>
          </div>
        )}
        <CardContent className="p-0 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          {coursesLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-sm text-muted-foreground">
              <svg className="google-spinner" viewBox="0 0 50 50">
                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
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
              {courseSearchQuery.trim() ? '没有匹配的课程，请调整搜索条件。' : '没有可显示课程，请刷新课程后重试。'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredCourses.map((course) => {
                const jobFinishCount = course.jobFinishCount;
                const jobCount = course.jobCount;
                const hasJobProgress = typeof jobFinishCount === 'number' && typeof jobCount === 'number';
                const calculatedJobRate = hasJobProgress && jobCount > 0
                  ? Math.round((jobFinishCount / jobCount) * 100)
                  : null;
                const rawJobRate = course.jobRate ?? calculatedJobRate;
                const jobRate = rawJobRate === null ? null : Math.round(Math.max(0, Math.min(100, rawJobRate)));
                const jobProgressLabel = hasJobProgress ? `${jobFinishCount}/${jobCount} (${jobRate ?? 0}%)` : null;
                const isProcessing = course.processing === true;
                const processingTaskLabel = course.processingTaskId ? course.processingTaskId.substring(0, 8) : null;
                const canStopProcessing = isProcessing && Boolean(course.processingTaskId);
                const isStoppingProcessing = course.processingTaskId === stoppingTaskId;
                const isExpanded = expandedCourses.has(course.key);
                const isCourseOutlineFullyExpanded = fullyExpandedCourseOutlines.has(course.key);
                const isSelected = selectedCourses.has(course.key);
                const handleCourseRowClick = (event: MouseEvent<HTMLDivElement>) => {
                  const target = event.target as HTMLElement;
                  if (target.closest('button, input, a, [role="checkbox"]')) return;
                  onToggleCourseSelection(course.key);
                };

                return (
                  <div key={course.key} className="border-b border-border/40 last:border-0">
                    <div onClick={handleCourseRowClick} className={`relative grid cursor-pointer grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-2 px-3 py-3.5 transition-colors duration-150 ease-standard sm:grid-cols-[auto_minmax(0,1fr)_13rem] sm:gap-x-4 sm:p-5 ${
                      isSelected
                        ? 'bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/15'
                        : 'hover:bg-muted/40'
                    }`}>
                      {isSelected && (
                        <span aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-r bg-primary" />
                      )}
                      <div className="contents">
                        <CourseCheckbox
                          checked={isSelected}
                          disabled={isProcessing}
                          indeterminate={false}
                          onChange={() => onToggleCourseSelection(course.key)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-xs font-semibold text-foreground sm:text-sm">{course.courseName}</h3>
                            {isProcessing && (
                              <Badge variant="outline" className="border-warning/20 bg-warning-container text-warning">
                                处理中
                              </Badge>
                            )}
                          </div>
                          {(course.beginDate || course.endDate) && (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              开课时间：{formatCourseDate(course.beginDate) ?? '未设置'}~{formatCourseDate(course.endDate) ?? '未设置'}
                            </p>
                          )}
                          {processingTaskLabel && (
                            <span className="mt-1 inline-flex w-fit items-center rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                              #{processingTaskLabel}
                            </span>
                          )}
                          {jobRate !== null && jobProgressLabel && (
                            <div className="mt-1.5 grid w-full max-w-lg grid-cols-[minmax(0,1fr)_7rem] items-center gap-2 sm:mt-2 sm:grid-cols-[minmax(0,1fr)_8rem] sm:gap-3">
                              <Progress value={jobRate} className={`h-1.5 bg-muted ${isProcessing ? 'progress-running' : ''}`} />
                              <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-muted-foreground">
                                {jobProgressLabel}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1 sm:w-52 sm:flex-nowrap sm:gap-2">
                        {canStopProcessing && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isStoppingProcessing}
                            onClick={() => onStopTask(course.processingTaskId as string)}
                            className="h-8 w-8 gap-1 rounded border-danger/30 px-0 text-xs text-danger hover:border-danger hover:bg-danger-container/20 sm:w-auto sm:px-2.5"
                            aria-label={isStoppingProcessing ? '停止任务中' : '停止任务'}
                          >
                            {isStoppingProcessing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5 fill-current" />}
                            <span className="sr-only sm:not-sr-only">{isStoppingProcessing ? '停止中' : '停止'}</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleExpandCourse(course.key)}
                          className={`h-8 w-8 gap-1 rounded border px-0 text-xs transition-all duration-150 sm:w-auto sm:px-2 ${
                            isExpanded
                              ? 'border-primary/40 bg-primary/10 text-primary'
                              : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary'
                          }`}
                          aria-label={isExpanded ? '收起章节' : '查看章节'}
                        >
                          <span className="sr-only sm:not-sr-only">{isExpanded ? '收起章节' : '查看章节'}</span>
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ease-standard ${isExpanded ? 'rotate-180' : ''}`} />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border/40 bg-muted/20 px-3 pb-3 pl-11 pt-3 sm:px-5 sm:pb-5 sm:pl-12 sm:pt-4 animate-in fade-in-0 duration-150">
                        {loadingDetails[course.key] ? (
                          <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                            <svg className="google-spinner h-4 w-4" viewBox="0 0 50 50">
                              <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
                            </svg>
                            <span>正在拉取章节...</span>
                          </div>
                        ) : courseDetailsMap[course.key] ? (
                          <CourseOutline
                            accountId={accountId}
                            courseKey={course.key}
                            courseDetails={courseDetailsMap[course.key]}
                            isFullyExpanded={isCourseOutlineFullyExpanded}
                            onToggleFullOutline={() => onToggleFullCourseOutline(course.key)}
                          />
                        ) : (
                          <div className="py-2 text-xs text-muted-foreground">无法加载章节。请点击右上角刷新重试。</div>
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
