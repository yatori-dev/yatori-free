import { useEffect, useRef } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Square,
  X,
} from 'lucide-react';
import type { CourseDetails, CourseSummary, StudyIncrement } from '@/lib/api';
import { getCourseDocumentDownloadUrl } from '@/lib/api';
import { extractChapterItems, getChapterDocuments, getChapterTaskMetas, getCourseTaskPointGroups } from '@/lib/courseChapters';
import { COURSE_TASK_POINT_KIND_LABELS, formatFileSize, getCourseDocumentFileName, getCourseDocumentTypeLabel } from '@/lib/coursePresentation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { CourseBulkSelectionMenu } from './CourseBulkSelectionMenu';

interface CourseCheckboxProps {
  checked: boolean;
  disabled?: boolean;
  indeterminate: boolean;
  onChange: () => void;
}

function CourseCheckbox({ checked, disabled = false, indeterminate, onChange }: CourseCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className="h-4 w-4 shrink-0 cursor-pointer rounded border-border bg-card accent-primary disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

interface CourseListSectionProps {
  accountId?: string;
  courses: CourseSummary[];
  filteredCourses: CourseSummary[];
  coursesLoading: boolean;
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
  studyIncrements: Record<string, StudyIncrement>;
  defaultStudyIncrement: StudyIncrement;
  onRefresh: () => void;
  onSearchChange: (value: string) => void;
  onSearchQueryChange: (value: string) => void;
  onToggleSelectAll: () => void;
  onToggleSelectIncomplete: () => void;
  onToggleCourseSelection: (courseKey: string) => void;
  onOpenStudyIncrementSettings: (courseKey: string) => void;
  onStopTask: (taskId: string) => void;
  onToggleExpandCourse: (courseKey: string) => void;
  onToggleFullCourseOutline: (courseKey: string) => void;
}

export function CourseListSection({
  accountId,
  courses,
  filteredCourses,
  coursesLoading,
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
  studyIncrements,
  defaultStudyIncrement,
  onRefresh,
  onSearchChange,
  onSearchQueryChange,
  onToggleSelectAll,
  onToggleSelectIncomplete,
  onToggleCourseSelection,
  onOpenStudyIncrementSettings,
  onStopTask,
  onToggleExpandCourse,
  onToggleFullCourseOutline,
}: CourseListSectionProps) {
  const isCourseSearchComposing = useRef(false);

  return (
    <TabsContent forceMount value="courses" className="m-0 outline-none data-[state=inactive]:hidden lg:min-h-0 lg:flex-1">
      <Card className="rounded-none border-none bg-card py-0 shadow-none ring-0 sm:rounded-xl sm:py-4 sm:shadow-sm lg:flex lg:h-full lg:min-h-0 lg:flex-col">
        <CardHeader className="flex flex-row items-center gap-2 rounded-none border-b border-border/50 px-3 py-2.5 sm:justify-between sm:px-6 sm:py-4 sm:space-y-0">
          <div className="flex shrink-0 items-center gap-1 sm:block lg:hidden">
            <CardTitle className="whitespace-nowrap text-sm font-semibold sm:text-base">课程列表</CardTitle>
            <Button
              size="icon"
              variant="ghost"
              disabled={coursesLoading}
              onClick={onRefresh}
              className="h-8 w-8 shrink-0 rounded-full hover:bg-muted sm:hidden"
              title="刷新课程"
              aria-label="刷新课程"
            >
              <RefreshCw className={`h-4 w-4 ${coursesLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:justify-end lg:justify-start">
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
              className="hidden h-8 w-8 shrink-0 rounded-full hover:bg-muted sm:flex"
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
          ) : courses.length === 0 ? (
            <div className="p-12 text-center font-sans text-sm text-muted-foreground">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              暂无关联课程，您可以尝试点击右上角刷新重试。
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-12 text-center font-sans text-sm text-muted-foreground">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              {courseSearchQuery.trim() ? '没有匹配的课程，请调整搜索条件。' : '没有可显示课程，可在设置中关闭隐藏无任务点课程。'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {selectableCourses.length > 0 && (
                <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2.5 select-none sm:gap-4 sm:px-5 sm:py-3.5">
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
                    <CourseBulkSelectionMenu
                      allSelected={isAllSelected}
                      allSelectionIndeterminate={isSomeSelected && !isAllSelected}
                      incompleteAvailable={incompleteSelectableCourses.length > 0}
                      incompleteSelected={isAllIncompleteSelected}
                      onToggleAll={onToggleSelectAll}
                      onToggleIncomplete={onToggleSelectIncomplete}
                    />
                  </div>
                  <div className="whitespace-nowrap text-[11px] text-muted-foreground sm:text-xs">
                    已选择 {selectedCourses.size} / {selectableCourses.length} 门课程
                  </div>
                </div>
              )}

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
                const blockedPointCount = courseDetailsMap[course.key]?.blockedPointCount ?? 0;
                const isExpanded = expandedCourses.has(course.key);
                const isCourseOutlineFullyExpanded = fullyExpandedCourseOutlines.has(course.key);
                const isSelected = selectedCourses.has(course.key);
                const studyIncrement = studyIncrements[course.key] ?? defaultStudyIncrement;
                const studyVisitCount = studyIncrement.visitCount ?? 0;
                const videoStudyMinutes = studyIncrement.videoStudyMinutes ?? 0;
                const hasReadTaskPoints = courseDetailsMap[course.key]?.hasReadTaskPoints === true;
                const readMinutes = hasReadTaskPoints ? (studyIncrement.readMinutes ?? 0) : 0;
                const hasStudyIncrement = studyVisitCount > 0 || videoStudyMinutes > 0 || readMinutes > 0;
                const studyIncrementSummary = [
                  studyVisitCount > 0 ? `+${studyVisitCount}次` : null,
                  videoStudyMinutes > 0 ? `视频观看 +${videoStudyMinutes}分钟` : null,
                  readMinutes > 0 ? `阅读 +${readMinutes}分钟` : null,
                ].filter(Boolean).join(' ');

                return (
                  <div key={course.key} className="border-b border-border last:border-0">
                    <div className={`grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-2 px-3 py-3.5 transition-colors sm:grid-cols-[auto_minmax(0,1fr)_13rem] sm:gap-x-4 sm:p-5 ${
                      isSelected ? 'bg-primary-container/20 hover:bg-primary-container/30' : 'hover:bg-muted/40'
                    }`}>
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
                            {blockedPointCount > 0 && (
                              <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
                                含未开放任务点 {blockedPointCount}
                              </Badge>
                            )}
                            {isProcessing && (
                              <Badge variant="outline" className="border-warning/20 bg-warning-container text-warning">
                                处理中
                              </Badge>
                            )}
                          </div>
                          {processingTaskLabel && (
                            <span className="mt-1 inline-flex w-fit items-center rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                              #{processingTaskLabel}
                            </span>
                          )}
                          {jobRate !== null && jobProgressLabel && (
                            <div className="mt-1.5 grid w-full max-w-lg grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:mt-2 sm:grid-cols-[minmax(0,1fr)_8rem] sm:gap-3">
                              <Progress value={jobRate} className={`h-1.5 bg-muted ${isProcessing ? 'progress-running' : ''}`} />
                              <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-muted-foreground">
                                {jobProgressLabel}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1 sm:w-52 sm:flex-nowrap sm:gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => onOpenStudyIncrementSettings(course.key)}
                          className={`h-8 w-8 rounded px-0 text-xs sm:w-auto ${
                            hasStudyIncrement
                              ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary sm:gap-1 sm:px-2'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground sm:gap-1.5 sm:px-2.5'
                          }`}
                          title={hasStudyIncrement ? studyIncrementSummary : '设置学习目标'}
                          aria-label={hasStudyIncrement ? `学习目标：${studyIncrementSummary}` : '设置学习目标'}
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          <span className="sr-only sm:not-sr-only">学习目标</span>
                          {hasStudyIncrement && <span className="hidden text-xs lg:inline">{studyIncrementSummary}</span>}
                        </Button>
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
                          className="h-8 w-8 gap-1 rounded border border-primary/30 px-0 text-xs text-primary hover:bg-primary-container/20 sm:w-auto sm:px-2"
                          aria-label={isExpanded ? '收起章节' : '查看章节'}
                        >
                          {isExpanded ? (
                            <><span className="sr-only sm:not-sr-only">收起章节</span><ChevronUp className="h-3.5 w-3.5" /></>
                          ) : (
                            <><span className="sr-only sm:not-sr-only">查看章节</span><ChevronDown className="h-3.5 w-3.5" /></>
                          )}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border/50 bg-muted/20 px-3 pb-3 pl-11 pt-3 sm:px-5 sm:pb-5 sm:pl-12 sm:pt-4">
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

interface CourseOutlineProps {
  accountId?: string;
  courseKey: string;
  courseDetails: CourseDetails;
  isFullyExpanded: boolean;
  onToggleFullOutline: () => void;
}

function CourseOutline({ accountId, courseKey, courseDetails, isFullyExpanded, onToggleFullOutline }: CourseOutlineProps) {
  const chapterItems = extractChapterItems(courseDetails.chapters);
  const taskPointGroups = getCourseTaskPointGroups(courseDetails.taskPoints);
  const chaptersWithTasks = taskPointGroups.length > 0
    ? taskPointGroups.map(({ chapter, taskPoints }) => ({
      chapter,
      taskPoints,
      taskMeta: {
        total: taskPoints.length,
        finished: taskPoints.filter((taskPoint) => taskPoint.completed === true).length,
        isLocked: false,
        hasTaskPoints: true,
      },
    }))
    : getChapterTaskMetas(chapterItems)
      .filter(({ taskMeta }) => taskMeta.hasTaskPoints)
      .map(({ chapter, taskMeta }) => ({ chapter, taskMeta, taskPoints: [] }));

  return (
    <div className="space-y-2">
      {courseDetails.taskPointsIncomplete && (
        <div className="flex items-start gap-2 rounded-md bg-warning-container/40 px-2.5 py-2 text-xs text-warning" role="status">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>部分章节任务点读取失败，当前大纲可能不完整。</span>
        </div>
      )}
      <div className={isFullyExpanded ? undefined : 'max-sm:max-h-64 max-sm:overflow-hidden'}>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">章节大纲 ({chaptersWithTasks.length})</div>
        <div className="grid grid-cols-1 gap-2 pr-1 md:max-h-[300px] md:grid-cols-2 md:overflow-y-auto">
          {chaptersWithTasks.map(({ chapter: chapterItem, taskMeta, taskPoints }) => {
            const isChapterDone = !taskMeta.isLocked && taskMeta.total > 0 && taskMeta.finished === taskMeta.total;
            const chapterDocuments = getChapterDocuments(chapterItem, courseDetails.documents);
            const statusClassName = taskMeta.isLocked
              ? 'border-border bg-muted text-muted-foreground'
              : isChapterDone
                ? 'border-success/20 bg-success-container text-success'
                : 'border-warning/20 bg-warning-container text-warning';

            return (
              <div key={chapterItem.id} className="rounded border border-border bg-card p-2.5 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="mr-1.5 font-semibold text-muted-foreground">{chapterItem.label}</span>
                    <span className="font-medium text-foreground">{chapterItem.name}</span>
                  </div>
                  <Badge className={`shrink-0 border text-xs font-normal ${statusClassName}`}>
                    {taskPoints.length > 0
                      ? `模块: ${taskMeta.finished}/${taskMeta.total}`
                      : taskMeta.isLocked
                        ? `未开放任务点: ${taskMeta.total}`
                        : `任务点: ${taskMeta.finished}/${taskMeta.total}`}
                  </Badge>
                </div>

                {taskPoints.length > 0 && (
                  <div className="mt-2 space-y-1.5 border-t border-border/70 pt-2">
                    {taskPoints.map((taskPoint) => (
                      <div key={taskPoint.id} className="flex items-center gap-2 rounded bg-muted/60 px-2 py-1.5">
                        <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
                          {COURSE_TASK_POINT_KIND_LABELS[taskPoint.kind]}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-foreground" title={taskPoint.title}>
                          {taskPoint.title || taskPoint.module}
                        </span>
                        {taskPoint.completed !== undefined && (
                          <span className={taskPoint.completed ? 'shrink-0 text-[11px] text-success' : 'shrink-0 text-[11px] text-muted-foreground'}>
                            {taskPoint.completed ? '已完成' : '未完成'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {accountId && chapterDocuments.length > 0 && (
                  <div className="mt-2 space-y-1.5 border-t border-border/70 pt-2">
                    {chapterDocuments.map((document) => {
                      const fileSize = formatFileSize(document.size);
                      const fileName = getCourseDocumentFileName(document);
                      return (
                        <div key={document.id} className="flex items-center gap-2 rounded bg-muted/60 px-2 py-1.5">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium text-foreground">{document.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {getCourseDocumentTypeLabel(document)}{fileSize ? ` · ${fileSize}` : ''}
                            </div>
                          </div>
                          <Button asChild variant="ghost" size="sm" className="h-7 w-7 shrink-0 rounded p-0 text-primary">
                            <a
                              href={getCourseDocumentDownloadUrl(accountId, courseKey, document.id)}
                              download={fileName}
                              aria-label={`下载 ${document.name}`}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {chaptersWithTasks.length === 0 && (
            <div className="col-span-2 py-4 text-center text-xs text-muted-foreground">
              {courseDetails.taskPointsIncomplete ? '课程任务点读取不完整' : '该课程没有任务点'}
            </div>
          )}
        </div>
      </div>
      {chaptersWithTasks.length > 3 && (
        <Button type="button" variant="ghost" size="sm" className="mt-2 h-8 w-full gap-1 text-xs text-primary sm:hidden" onClick={onToggleFullOutline} aria-expanded={isFullyExpanded}>
          {isFullyExpanded ? <><span>收起章节列表</span><ChevronUp className="h-3.5 w-3.5" /></> : <><span>显示全部 {chaptersWithTasks.length} 个章节</span><ChevronDown className="h-3.5 w-3.5" /></>}
        </Button>
      )}
    </div>
  );
}
