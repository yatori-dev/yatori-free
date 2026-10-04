import { useMemo, type RefObject } from 'react';
import { Activity } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';
import type {
  CourseDetails,
  CourseSummary,
  StudyIncrement,
  Task,
} from '@/lib/api';
import type { TaskProgressSnapshot } from '@/hooks/useTaskProgressPolling';
import type { CourseTaskPointProgressMap } from '@/lib/taskProgress';
import { getDeadlineUrgencyLabel } from '@/lib/format';
import { TaskStatusContent } from './TaskStatusContent';
import { CourseListSection } from './CourseListSection';
import { CourseProgressSummary } from './CourseProgressSummary';
import { WorksListSection } from './WorksListSection';
import { ExamsListSection } from './ExamsListSection';
import { StudyGoalsPage } from './StudyGoalsPage';
import {
  mobileLearningTabs,
  type MobileDashboardTabId,
} from './dashboardNavigationData';

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
  showDeadlineBadges: boolean;
  workAutoSubmit: 0 | 1 | 2;
  examAutoSubmit: 0 | 1 | 2;
  onRefreshCourses: () => void;
  onSearchChange: (value: string) => void;
  onSearchQueryChange: (value: string) => void;
  onToggleCourseSelection: (courseKey: string) => void;
  onOpenStudyIncrementSettings: (courseKey: string) => void;
  onStopTask: (taskId: string) => void;
  onToggleExpandCourse: (courseKey: string) => void;
  onToggleFullCourseOutline: (courseKey: string) => void;
  onTaskFilterChange: (filter: 'active' | 'completed') => void;
  onRefreshTasks: () => void;
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
  showDeadlineBadges,
  workAutoSubmit,
  examAutoSubmit,
  onRefreshCourses,
  onSearchChange,
  onSearchQueryChange,
  onToggleCourseSelection,
  onOpenStudyIncrementSettings,
  onStopTask,
  onToggleExpandCourse,
  onToggleFullCourseOutline,
  onTaskFilterChange,
  onRefreshTasks,
  onWorkAutoSubmitChange,
  onExamAutoSubmitChange,
  onTabChange,
  onToggleSelectWork,
  onToggleSelectCourseWorks,
  onToggleSelectExam,
  onToggleSelectCourseExams,
}: DashboardMainContentProps) {
  const isLearningTab =
    activeTab === 'courses' || activeTab === 'works' || activeTab === 'exams';
  const urgentCounts = useMemo(() => {
    let works = 0;
    let exams = 0;

    Object.values(courseDetailsMap).forEach((details) => {
      if (showDeadlineBadges) {
        works += (details.works ?? []).filter(
          (work) => work.runnable && getDeadlineUrgencyLabel(work.endAt),
        ).length;
        exams += (details.exams ?? []).filter(
          (exam) => exam.runnable && getDeadlineUrgencyLabel(exam.endAt),
        ).length;
      }
    });

    return { works, exams };
  }, [courseDetailsMap, showDeadlineBadges]);

  return (
    <main
      ref={mainRef}
      id="dashboard-main"
      className="min-h-0 flex-1 overflow-x-clip overflow-y-auto bg-background pb-[calc(10rem+env(safe-area-inset-bottom))] lg:pb-24"
    >
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 py-4 sm:px-5 lg:px-6 lg:py-6">
        <div className="min-w-0 space-y-4 sm:space-y-6">
          {isLearningTab && (
            <div className="lg:hidden">
              <div className="flex items-center rounded-[var(--radius-lg)] bg-muted p-1 text-xs font-medium text-muted-foreground">
                {mobileLearningTabs.map((tab) => {
                  const active = activeTab === tab.id;
                  const Icon = tab.icon;
                  const urgentCount =
                    tab.id === 'works'
                      ? urgentCounts.works
                      : tab.id === 'exams'
                        ? urgentCounts.exams
                        : 0;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onTabChange(tab.id)}
                      className={`relative flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] px-2 text-xs font-medium transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        active
                          ? 'bg-background text-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 truncate">{tab.label}</span>
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
                totalTaskPointCount={courses.reduce(
                  (total, course) => total + Math.max(0, course.jobCount ?? 0),
                  0,
                )}
                completedTaskPointCount={courses.reduce(
                  (total, course) =>
                    total + Math.min(
                      Math.max(0, course.jobFinishCount ?? 0),
                      Math.max(0, course.jobCount ?? 0),
                    ),
                  0,
                )}
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
              selectedCourses={selectedCourses}
              expandedCourses={expandedCourses}
              fullyExpandedCourseOutlines={fullyExpandedCourseOutlines}
              courseDetailsMap={courseDetailsMap}
              loadingDetails={loadingDetails}
              stoppingTaskId={stoppingTaskId}
              onRefresh={onRefreshCourses}
              onSearchChange={onSearchChange}
              onSearchQueryChange={onSearchQueryChange}
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
              showDeadlineBadges={showDeadlineBadges}
              submitMode={workAutoSubmit}
              onSubmitModeChange={onWorkAutoSubmitChange}
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
              showDeadlineBadges={showDeadlineBadges}
              submitMode={examAutoSubmit}
              onSubmitModeChange={onExamAutoSubmitChange}
              onToggleSelectExam={onToggleSelectExam}
              onToggleSelectCourseExams={onToggleSelectCourseExams}
              onRefreshCourses={onRefreshCourses}
            />

            <TabsContent value="study" className="m-0 outline-none">
              <StudyGoalsPage
                courses={courses}
                studyIncrements={studyIncrements}
                defaultStudyIncrement={defaultStudyIncrement}
                onOpenStudyIncrementSettings={onOpenStudyIncrementSettings}
              />
            </TabsContent>

            <TabsContent value="tasks" className="m-0 min-h-full outline-none">
              <section className="min-h-full min-w-0" aria-label="任务">
                <div className="border-b border-border pb-4">
                  <h2 className="flex items-center gap-2 text-base font-semibold">
                    <Activity className="h-4 w-4 text-primary" />
                    任务
                  </h2>
                </div>
                <div className="flex min-h-[28rem] min-w-0 flex-col">
                  <TaskStatusContent
                    tasks={tasks}
                    filteredTasks={filteredTasks}
                    taskCounts={taskCounts}
                    taskFilter={taskFilter}
                    tasksLoading={tasksLoading}
                    taskSnapshots={taskSnapshots}
                    courseNameByIdentifier={courseNameByIdentifier}
                    courseTaskPointProgressByIdentifier={
                      courseTaskPointProgressByIdentifier
                    }
                    onTaskFilterChange={onTaskFilterChange}
                    onRefresh={onRefreshTasks}
                    onStopTask={onStopTask}
                  />
                </div>
              </section>
            </TabsContent>
          </div>
        </div>
      </div>
    </main>
  );
}
