import { useMemo, type RefObject } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import type { CourseDetails, CourseSummary, StudyIncrement, Task } from '@/lib/api';
import type { TaskProgressSnapshot } from '@/hooks/useTaskProgressPolling';
import type { CourseTaskPointProgressMap } from '@/lib/taskProgress';
import { getDeadlineUrgencyLabel } from '@/lib/format';
import { TaskSettingsPanel } from './TaskSettingsPanel';
import { TaskStatusContent } from './TaskStatusContent';
import { CourseListSection } from './CourseListSection';
import { CourseProgressSummary } from './CourseProgressSummary';
import { WorksListSection } from './WorksListSection';
import { ExamsListSection } from './ExamsListSection';
import { StudyGoalsPage } from './StudyGoalsPage';
import { mobileLearningTabs, type MobileDashboardTabId } from './dashboardNavigationData';

interface DashboardMainContentProps {
  mainRef: RefObject<HTMLElement | null>;
  activeTab: MobileDashboardTabId;
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
  selectedWorks: Record<string, Set<string>>;
  selectedExams: Record<string, Set<string>>;
  expandedCourses: Set<string>;
  fullyExpandedCourseOutlines: Set<string>;
  courseDetailsMap: Record<string, CourseDetails>;
  loadingDetails: Record<string, boolean>;
  stoppingTaskId: string | null;
  studyIncrements: Record<string, StudyIncrement>;
  defaultStudyIncrement: StudyIncrement;
  taskCounts: { active: number; completed: number };
  tasks: Task[];
  filteredTasks: Task[];
  taskFilter: 'active' | 'completed';
  tasksLoading: boolean;
  taskSnapshots: Record<string, TaskProgressSnapshot>;
  courseNameByIdentifier: Record<string, string>;
  courseTaskPointProgressByIdentifier: CourseTaskPointProgressMap;
  bypassDailyStudyLimit: boolean;
  doChapterTest: boolean;
  workAutoSubmit: 0 | 1 | 2;
  examAutoSubmit: 0 | 1 | 2;
  onUnauthorized: () => void;
  onRefreshCourses: () => void;
  onSearchChange: (value: string) => void;
  onSearchQueryChange: (value: string) => void;
  onToggleSelectAll: () => void;
  onToggleSelectIncomplete: () => void;
  onToggleCourseSelection: (courseKey: string) => void;
  onOpenStudyIncrementSettings: (courseKey: string) => void;
  onStopTask: (taskId: string) => void;
  onToggleExpandCourse: (courseKey: string) => void;
  onToggleFullCourseOutline: (courseKey: string) => void;
  onTaskFilterChange: (filter: 'active' | 'completed') => void;
  onRefreshTasks: () => void;
  onSettingSwitch: (key: 'bypassDailyStudyLimit' | 'doChapterTest', checked: boolean) => void;
  onWorkAutoSubmitChange: (value: 0 | 1 | 2) => void;
  onExamAutoSubmitChange: (value: 0 | 1 | 2) => void;
  onTabChange: (tab: MobileDashboardTabId) => void;
  onToggleSelectWork: (classId: string, workId: string) => void;
  onToggleSelectCourseWorks: (classId: string) => void;
  onToggleSelectExam: (classId: string, examId: string) => void;
  onToggleSelectCourseExams: (classId: string) => void;
}

export function DashboardMainContent({
  mainRef,
  activeTab,
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
  selectedWorks,
  selectedExams,
  expandedCourses,
  fullyExpandedCourseOutlines,
  courseDetailsMap,
  loadingDetails,
  stoppingTaskId,
  studyIncrements,
  defaultStudyIncrement,
  taskCounts,
  tasks,
  filteredTasks,
  taskFilter,
  tasksLoading,
  taskSnapshots,
  courseNameByIdentifier,
  courseTaskPointProgressByIdentifier,
  bypassDailyStudyLimit,
  doChapterTest,
  workAutoSubmit,
  examAutoSubmit,
  onUnauthorized,
  onRefreshCourses,
  onSearchChange,
  onSearchQueryChange,
  onToggleSelectAll,
  onToggleSelectIncomplete,
  onToggleCourseSelection,
  onOpenStudyIncrementSettings,
  onStopTask,
  onToggleExpandCourse,
  onToggleFullCourseOutline,
  onTaskFilterChange,
  onRefreshTasks,
  onSettingSwitch,
  onWorkAutoSubmitChange,
  onExamAutoSubmitChange,
  onTabChange,
  onToggleSelectWork,
  onToggleSelectCourseWorks,
  onToggleSelectExam,
  onToggleSelectCourseExams,
}: DashboardMainContentProps) {
  const isLearningTab = activeTab === 'courses' || activeTab === 'works' || activeTab === 'exams';
  const urgentCounts = useMemo(() => {
    let works = 0;
    let exams = 0;

    Object.values(courseDetailsMap).forEach((details) => {
      works += (details.works ?? []).filter((work) => work.runnable && getDeadlineUrgencyLabel(work.endAt)).length;
      exams += (details.exams ?? []).filter((exam) => exam.runnable && getDeadlineUrgencyLabel(exam.endAt)).length;
    });

    return { works, exams };
  }, [courseDetailsMap]);

  return (
    <main ref={mainRef} id="dashboard-main" className="min-h-0 flex-1 overflow-x-clip overflow-y-auto pb-[calc(8.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="mx-auto w-full min-w-0 px-0 py-0 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 lg:py-6">
        <div className="min-w-0">
          {/* Mobile Top Segmented Control for Learning sub-tabs */}
          {isLearningTab && (
            <div className="px-3 pt-2.5 pb-1 lg:hidden">
              <div className="flex items-center rounded-xl bg-muted/80 p-1 text-xs font-medium text-muted-foreground shadow-inner">
                {mobileLearningTabs.map((tab) => {
                  const active = activeTab === tab.id;
                  const Icon = tab.icon;
                  const urgentCount = tab.id === 'works' ? urgentCounts.works : tab.id === 'exams' ? urgentCounts.exams : 0;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onTabChange(tab.id)}
                      className={`relative flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-all duration-200 ${
                        active
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{tab.label}</span>
                      {urgentCount > 0 && (
                        <span
                          className="inline-flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-4 text-primary-foreground"
                          aria-label={`${urgentCount} 项即将截止`}
                        >
                          {urgentCount > 99 ? '99+' : urgentCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div data-dashboard-tab-content>
          {activeTab === 'courses' && (
            <CourseProgressSummary
              visibleCount={courses.length}
              incompleteCount={incompleteSelectableCourses.length}
              activeTaskCount={taskCounts.active}
            />
          )}

          <CourseListSection
            accountId={accountId}
            courses={courses}
            filteredCourses={filteredCourses}
            coursesLoading={coursesLoading}
            coursesError={coursesError}
            courseSearch={courseSearch}
            courseSearchQuery={courseSearchQuery}
            selectableCourses={selectableCourses}
            incompleteSelectableCourses={incompleteSelectableCourses}
            isAllSelected={isAllSelected}
            isSomeSelected={isSomeSelected}
            isAllIncompleteSelected={isAllIncompleteSelected}
            selectedCourses={selectedCourses}
            expandedCourses={expandedCourses}
            fullyExpandedCourseOutlines={fullyExpandedCourseOutlines}
            courseDetailsMap={courseDetailsMap}
            loadingDetails={loadingDetails}
            stoppingTaskId={stoppingTaskId}
            onRefresh={onRefreshCourses}
            onSearchChange={onSearchChange}
            onSearchQueryChange={onSearchQueryChange}
            onToggleSelectAll={onToggleSelectAll}
            onToggleSelectIncomplete={onToggleSelectIncomplete}
            onToggleCourseSelection={onToggleCourseSelection}
            onStopTask={onStopTask}
            onToggleExpandCourse={onToggleExpandCourse}
            onToggleFullCourseOutline={onToggleFullCourseOutline}
          />

          <WorksListSection
            hideUnavailable
            courses={courses}
            coursesLoading={coursesLoading}
            courseDetailsMap={courseDetailsMap}
            loadingDetails={loadingDetails}
            selectedWorks={selectedWorks}
            expandedCourses={expandedCourses}
            submitMode={workAutoSubmit}
            onSubmitModeChange={onWorkAutoSubmitChange}
            onToggleExpandCourse={onToggleExpandCourse}
            onToggleSelectWork={onToggleSelectWork}
            onToggleSelectCourseWorks={onToggleSelectCourseWorks}
            onRefreshCourses={onRefreshCourses}
          />

          <ExamsListSection
            hideUnavailable
            courses={courses}
            coursesLoading={coursesLoading}
            courseDetailsMap={courseDetailsMap}
            loadingDetails={loadingDetails}
            selectedExams={selectedExams}
            expandedCourses={expandedCourses}
            submitMode={examAutoSubmit}
            onSubmitModeChange={onExamAutoSubmitChange}
            onToggleExpandCourse={onToggleExpandCourse}
            onToggleSelectExam={onToggleSelectExam}
            onToggleSelectCourseExams={onToggleSelectCourseExams}
            onRefreshCourses={onRefreshCourses}
          />

          <TabsContent value="settings" className="m-0 outline-none">
            <TaskSettingsPanel
              bypassDailyStudyLimit={bypassDailyStudyLimit}
              doChapterTest={doChapterTest}
              onUnauthorized={onUnauthorized}
              onSettingSwitch={onSettingSwitch}
            />
          </TabsContent>

          <TabsContent value="study" className="m-0 outline-none">
            <StudyGoalsPage
              courses={courses}
              studyIncrements={studyIncrements}
              defaultStudyIncrement={defaultStudyIncrement}
              onOpenStudyIncrementSettings={onOpenStudyIncrementSettings}
            />
          </TabsContent>

          <TabsContent value="tasks" className="m-0 min-h-full outline-none">
            <Card className="min-h-full min-w-0 overflow-hidden rounded-none border-none bg-card py-0 shadow-none ring-0 sm:rounded-xl sm:py-4 sm:shadow-sm sm:ring-0">
              <CardHeader className="rounded-none border-b border-border/50 px-3 py-2.5 sm:px-6 sm:py-4">
                <CardTitle className="text-sm font-semibold sm:text-base">任务</CardTitle>
                <CardDescription className="text-xs">查看任务运行状态与进度</CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-[28rem] min-w-0 flex-col p-0">
                <TaskStatusContent
                  tasks={tasks}
                  filteredTasks={filteredTasks}
                  taskCounts={taskCounts}
                  taskFilter={taskFilter}
                  tasksLoading={tasksLoading}
                  taskSnapshots={taskSnapshots}
                  courseNameByIdentifier={courseNameByIdentifier}
                  courseTaskPointProgressByIdentifier={courseTaskPointProgressByIdentifier}
                  onTaskFilterChange={onTaskFilterChange}
                  onRefresh={onRefreshTasks}
                  onStopTask={onStopTask}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
          </div>
      </div>
    </main>
  );
}
