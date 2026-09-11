import { useMemo } from 'react';
import {
  AlertCircle,
  CheckSquare,
  ChevronDown,
  FolderSync,
  GraduationCap,
  RefreshCw,
  Square,
} from 'lucide-react';
import type { CourseDetails, CourseExamItem, CourseSummary } from '@/lib/api';
import { getExamItemTitle } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { CourseCheckbox } from './CourseCheckbox';
import { SubmitModeControl, type SubmitMode } from './SubmitModeControl';

interface ExamsListSectionProps {
  courses: CourseSummary[];
  coursesLoading: boolean;
  courseDetailsMap: Record<string, CourseDetails>;
  loadingDetails: Record<string, boolean>;
  selectedExams: Record<string, Set<string>>;
  expandedCourses: Set<string>;
  hideUnavailable: boolean;
  submitMode: SubmitMode;
  onToggleExpandCourse: (courseKey: string) => void;
  onToggleSelectExam: (classId: string, examId: string) => void;
  onToggleSelectCourseExams: (classId: string) => void;
  onRefreshCourses: () => void;
  onSubmitModeChange: (value: SubmitMode) => void;
}

export function ExamsListSection({
  courses,
  coursesLoading,
  courseDetailsMap,
  loadingDetails,
  selectedExams,
  expandedCourses,
  hideUnavailable,
  submitMode,
  onToggleExpandCourse,
  onToggleSelectExam,
  onToggleSelectCourseExams,
  onRefreshCourses,
  onSubmitModeChange,
}: ExamsListSectionProps) {
  const totalExamsCount = useMemo(() => {
    let totalExamsCount = 0;

    courses.forEach((course) => {
      const details = courseDetailsMap[course.key];
      const allExams = details?.exams ?? [];
      const exams = allExams.filter((exam) => !hideUnavailable || exam.runnable);
      totalExamsCount += exams.length;
    });

    return totalExamsCount;
  }, [courses, courseDetailsMap, hideUnavailable]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const details = courseDetailsMap[course.key];
      return !details || (details.exams ?? []).some((exam) => !hideUnavailable || exam.runnable);
    });
  }, [courses, courseDetailsMap, hideUnavailable]);

  const hasLoadedDetails = useMemo(() => {
    return courses.some((course) => Boolean(courseDetailsMap[course.key]));
  }, [courses, courseDetailsMap]);

  return (
    <TabsContent forceMount value="exams" className="m-0 outline-none data-[state=inactive]:hidden lg:min-h-0 lg:flex-1">
      <Card className="rounded-none border-none bg-card py-0 shadow-none ring-0 sm:rounded-xl sm:py-4 sm:shadow-sm lg:flex lg:h-full lg:min-h-0 lg:flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 px-3 py-2.5 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2">
            <GraduationCap className="h-5 w-5 shrink-0 text-primary" />
            <CardTitle className="whitespace-nowrap text-sm font-semibold sm:text-base">考试</CardTitle>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <SubmitModeControl value={submitMode} onChange={onSubmitModeChange} />
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
              <p className="text-sm font-medium">未找到匹配的课程或考试</p>
            </div>
          ) : (
            <div className="space-y-3">
              {!hasLoadedDetails && (
                <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground sm:p-4">
                  <FolderSync className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-primary">尚未读取考试明细</p>
                    <p className="text-muted-foreground mt-0.5">
                      展开下方课程卡片即可查看考试明细，或点击右上角刷新课程以同步最新数据。
                    </p>
                  </div>
                </div>
              )}

              {hasLoadedDetails && totalExamsCount === 0 && (
                <div className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-muted/25 p-3 text-xs text-muted-foreground sm:p-4">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">当前暂无可执行考试</p>
                    <p className="mt-0.5 text-muted-foreground">
                      各课程已完成明细检查，暂无需要提交的考试。可点击右上角刷新重试。
                    </p>
                  </div>
                </div>
              )}

              {filteredCourses.map((course) => {
                const details = courseDetailsMap[course.key];
                const isLoading = loadingDetails[course.key] === true;
                const isExpanded = expandedCourses.has(course.key);
                const allExams = details?.exams ?? [];
                const exams: CourseExamItem[] = allExams.filter((exam) => !hideUnavailable || exam.runnable);
                const runnableExams = allExams.filter((e) => e.runnable);
                const courseSelected = selectedExams[course.key] ?? new Set<string>();

                const isAllCourseExamsSelected =
                  runnableExams.length > 0 && courseSelected.size === runnableExams.length;
                const isSomeCourseExamsSelected =
                  courseSelected.size > 0 && courseSelected.size < runnableExams.length;

                return (
                  <div
                    key={course.key}
                    className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-rest transition-all duration-200 ease-standard hover:shadow-raised hover:border-border"
                  >
                    <div className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-muted/20 transition-colors">
                      <div className="flex min-w-0 items-center gap-2.5 flex-1">
                        {details && runnableExams.length > 0 ? (
                          <CourseCheckbox checked={isAllCourseExamsSelected} indeterminate={isSomeCourseExamsSelected} onChange={() => onToggleSelectCourseExams(course.key)} />
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
                              runnableExams.length > 0
                                ? 'border-primary/30 bg-primary/10 text-primary'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {allExams.length === 0
                              ? '无考试'
                              : runnableExams.length === 0
                                ? `暂无可执行 (${allExams.length})`
                                : `${runnableExams.length} 可执行 / 共 ${allExams.length} 个`}
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleExpandCourse(course.key)}
                            className="h-7 text-xs text-primary"
                          >
                            加载考试
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onToggleExpandCourse(course.key)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={isExpanded ? '收起考试明细' : '展开考试明细'}
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ease-standard ${isExpanded ? 'rotate-180' : ''}`} />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border/50 p-3 sm:p-4 bg-card animate-in fade-in-0 duration-150">
                        {isLoading ? (
                          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                            <span>正在读取考试列表...</span>
                          </div>
                        ) : !details ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            <span>点击上方按钮加载考试明细</span>
                          </div>
                        ) : allExams.length === 0 ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            <span>该课程暂无考试</span>
                          </div>
                        ) : exams.length === 0 ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            <span>该课程考试均不可执行或已截止 (共 {allExams.length} 项)</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {exams.map((exam) => {
                              const title = getExamItemTitle(exam);
                              const isSelected = courseSelected.has(exam.id);
                              const isRunnable = exam.runnable;

                              return (
                                <div
                                  key={exam.id}
                                  onClick={() => {
                                    if (isRunnable) {
                                      onToggleSelectExam(course.key, exam.id);
                                    }
                                  }}
                                  className={`flex items-start gap-2.5 rounded-lg border p-3 text-xs transition-all duration-150 ease-standard ${
                                    isSelected
                                      ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-xs'
                                      : 'border-border/60 bg-muted/20 hover:border-primary/30 hover:bg-muted/40'
                                  } ${isRunnable ? 'cursor-pointer active:scale-[0.99]' : 'opacity-60 cursor-not-allowed'}`}
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

                                    {(exam.status !== undefined || exam.endDate) && (
                                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                                        {exam.status !== undefined && (
                                          <span>状态: {String(exam.status)}</span>
                                        )}
                                        {exam.endDate && <span>截止: {String(exam.endDate)}</span>}
                                        {exam.score !== undefined && (
                                          <span>成绩: {String(exam.score)}</span>
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
