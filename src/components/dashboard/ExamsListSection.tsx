import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  FolderSync,
  GraduationCap,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Square,
  X,
} from 'lucide-react';
import type { CourseDetails, CourseExamItem, CourseSummary } from '@/lib/api';
import { getExamItemTitle } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';

interface ExamsListSectionProps {
  courses: CourseSummary[];
  coursesLoading: boolean;
  courseDetailsMap: Record<string, CourseDetails>;
  loadingDetails: Record<string, boolean>;
  selectedExams: Record<string, Set<string>>;
  expandedCourses: Set<string>;
  examAutoSubmit: 0 | 1 | 2;
  onExamAutoSubmitChange: (value: 0 | 1 | 2) => void;
  onToggleExpandCourse: (courseKey: string) => void;
  onToggleSelectExam: (classId: string, examId: string) => void;
  onToggleSelectCourseExams: (classId: string) => void;
  onSelectAllRunnableExams: () => void;
  onClearSelectedExams: () => void;
  onRefreshCourses: () => void;
}

const AUTO_SUBMIT_LABELS: Record<0 | 1 | 2, string> = {
  0: '只保存答案',
  1: '答完后提交',
  2: '有空答案时只保存',
};

export function ExamsListSection({
  courses,
  coursesLoading,
  courseDetailsMap,
  loadingDetails,
  selectedExams,
  expandedCourses,
  examAutoSubmit,
  onExamAutoSubmitChange,
  onToggleExpandCourse,
  onToggleSelectExam,
  onToggleSelectCourseExams,
  onSelectAllRunnableExams,
  onClearSelectedExams,
  onRefreshCourses,
}: ExamsListSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const stats = useMemo(() => {
    let totalExamsCount = 0;
    let runnableExamsCount = 0;
    let selectedCount = 0;

    courses.forEach((course) => {
      const details = courseDetailsMap[course.key];
      const exams = details?.exams ?? [];
      totalExamsCount += exams.length;
      runnableExamsCount += exams.filter((e) => e.runnable).length;

      const courseSelected = selectedExams[course.key];
      if (courseSelected) {
        selectedCount += courseSelected.size;
      }
    });

    return { totalExamsCount, runnableExamsCount, selectedCount };
  }, [courses, courseDetailsMap, selectedExams]);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return courses;

    return courses.filter((course) => {
      const nameMatch = course.courseName.toLowerCase().includes(query);
      const teacherMatch = course.courseTeacher?.toLowerCase().includes(query) ?? false;
      const details = courseDetailsMap[course.key];
      const examMatch = details?.exams?.some((e) =>
        getExamItemTitle(e).toLowerCase().includes(query)
      ) ?? false;

      return nameMatch || teacherMatch || examMatch;
    });
  }, [courses, searchQuery, courseDetailsMap]);

  const hasAnyLoadedExams = stats.totalExamsCount > 0;
  const isAllRunnableSelected = stats.runnableExamsCount > 0 && stats.selectedCount === stats.runnableExamsCount;

  return (
    <TabsContent forceMount value="exams" className="m-0 outline-none data-[state=inactive]:hidden lg:min-h-0 lg:flex-1">
      <Card className="rounded-none border-none bg-card py-0 shadow-none ring-0 sm:rounded-xl sm:py-4 sm:shadow-sm lg:flex lg:h-full lg:min-h-0 lg:flex-col">
        <CardHeader className="flex flex-col gap-3 border-b border-border/50 px-3 py-2.5 sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-semibold sm:text-base">考试</CardTitle>
              {stats.totalExamsCount > 0 && (
                <Badge variant="outline" className="text-xs font-normal">
                  已发现 {stats.totalExamsCount} 个考试（{stats.runnableExamsCount} 个可执行）
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefreshCourses}
                disabled={coursesLoading}
                className="h-8 w-8 shrink-0 rounded-full hover:bg-muted"
                title="刷新课程"
              >
                <RefreshCw className={`h-4 w-4 ${coursesLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_auto] sm:items-center">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索课程名、教师或考试标题..."
                className="h-8 pl-8 pr-8 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-start gap-2 text-xs sm:justify-end">
              {stats.runnableExamsCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isAllRunnableSelected ? onClearSelectedExams : onSelectAllRunnableExams}
                  className="h-8 gap-1.5 text-xs"
                >
                  {isAllRunnableSelected ? (
                    <>
                      <Square className="h-3.5 w-3.5" />
                      <span>取消全选</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-3.5 w-3.5" />
                      <span>全选可执行 ({stats.runnableExamsCount})</span>
                    </>
                  )}
                </Button>
              )}

              <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="hidden min-[480px]:inline">提交策略:</span>
                <select
                  value={examAutoSubmit}
                  onChange={(e) => onExamAutoSubmitChange(Number(e.target.value) as 0 | 1 | 2)}
                  className="bg-transparent font-medium text-foreground focus:outline-none cursor-pointer"
                  aria-label="考试提交策略"
                >
                  <option value={0}>{AUTO_SUBMIT_LABELS[0]}</option>
                  <option value={1}>{AUTO_SUBMIT_LABELS[1]}</option>
                  <option value={2}>{AUTO_SUBMIT_LABELS[2]}</option>
                </select>
              </div>
            </div>
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
              <p className="text-xs mt-1">请尝试清除搜索关键字或扫描全部课程</p>
            </div>
          ) : (
            <div className="space-y-3">
              {!hasAnyLoadedExams && (
                <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground sm:p-4">
                  <FolderSync className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-primary">尚未读取考试明细</p>
                    <p className="text-muted-foreground mt-0.5">
                      点击下方课程卡片展开加载考试，或点击上方「扫描全部考试」按钮一次性读取全部课程的考试。
                    </p>
                  </div>
                </div>
              )}

              {filteredCourses.map((course) => {
                const details = courseDetailsMap[course.key];
                const isLoading = loadingDetails[course.key] === true;
                const isExpanded = expandedCourses.has(course.key);
                const exams: CourseExamItem[] = details?.exams ?? [];
                const runnableExams = exams.filter((e) => e.runnable);
                const courseSelected = selectedExams[course.key] ?? new Set<string>();

                const isAllCourseExamsSelected =
                  runnableExams.length > 0 && courseSelected.size === runnableExams.length;
                const isSomeCourseExamsSelected =
                  courseSelected.size > 0 && courseSelected.size < runnableExams.length;

                return (
                  <div
                    key={course.key}
                    className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm transition-colors hover:border-border"
                  >
                    <div className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-muted/20">
                      <div className="flex min-w-0 items-center gap-2.5 flex-1">
                        {details && runnableExams.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => onToggleSelectCourseExams(course.key)}
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-input text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={`全选课程 ${course.courseName} 的可执行考试`}
                          >
                            {isAllCourseExamsSelected ? (
                              <CheckSquare className="h-4 w-4 text-primary fill-primary/10" />
                            ) : isSomeCourseExamsSelected ? (
                              <div className="h-2 w-2 rounded-xs bg-primary" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        ) : (
                          <div className="w-5 shrink-0" />
                        )}

                        <div
                          className="min-w-0 flex-1 cursor-pointer"
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
                            {exams.length === 0
                              ? '无考试'
                              : `${runnableExams.length} 可执行 / 共 ${exams.length} 个`}
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
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          aria-label={isExpanded ? '收起考试明细' : '展开考试明细'}
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
                            <span>正在读取考试列表...</span>
                          </div>
                        ) : !details ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            <span>点击上方按钮加载考试明细</span>
                          </div>
                        ) : exams.length === 0 ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            <span>该课程暂无考试</span>
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
