import type { RefObject } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import type { CourseDetails, CourseSummary, StudyIncrement, Task } from '@/lib/api';
import type { TaskProgressSnapshot } from '@/hooks/useTaskProgressPolling';
import type { CourseTaskPointProgressMap } from '@/lib/taskProgress';
import { SignMonitor } from '@/components/SignMonitor';
import { TaskSettingsPanel } from './TaskSettingsPanel';
import { TaskStatusContent } from './TaskStatusContent';
import { CourseListSection } from './CourseListSection';
import { CourseProgressSummary } from './CourseProgressSummary';

interface DashboardMainContentProps {
  mainRef: RefObject<HTMLElement | null>;
  activeTab: 'courses' | 'sign' | 'tasks' | 'settings';
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
  taskCounts: { active: number; completed: number };
  tasks: Task[];
  filteredTasks: Task[];
  taskFilter: 'active' | 'completed';
  tasksLoading: boolean;
  taskSnapshots: Record<string, TaskProgressSnapshot>;
  courseNameByIdentifier: Record<string, string>;
  courseTaskPointProgressByIdentifier: CourseTaskPointProgressMap;
  hiddenEmptyTaskCourseCount: number;
  hideEmptyTaskCourses: boolean;
  bypassDailyStudyLimit: boolean;
  doChapterTest: boolean;
  doWork: boolean;
  workAutoSubmit: 0 | 1 | 2;
  doExam: boolean;
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
  onSettingSwitch: (key: 'hideEmptyTaskCourses' | 'bypassDailyStudyLimit' | 'doChapterTest' | 'doWork' | 'doExam', checked: boolean) => void;
  onWorkAutoSubmitChange: (value: 0 | 1 | 2) => void;
  onExamAutoSubmitChange: (value: 0 | 1 | 2) => void;
  onSignStatusChange: (active: boolean) => void;
}

export function DashboardMainContent({ mainRef, activeTab, accountId, courses, filteredCourses, coursesLoading, courseSearch, courseSearchQuery, selectableCourses, incompleteSelectableCourses, isAllSelected, isSomeSelected, isAllIncompleteSelected, selectedCourses, expandedCourses, fullyExpandedCourseOutlines, courseDetailsMap, loadingDetails, stoppingTaskId, studyIncrements, defaultStudyIncrement, taskCounts, tasks, filteredTasks, taskFilter, tasksLoading, taskSnapshots, courseNameByIdentifier, courseTaskPointProgressByIdentifier, hiddenEmptyTaskCourseCount, hideEmptyTaskCourses, bypassDailyStudyLimit, doChapterTest, doWork, workAutoSubmit, doExam, examAutoSubmit, onUnauthorized, onRefreshCourses, onSearchChange, onSearchQueryChange, onToggleSelectAll, onToggleSelectIncomplete, onToggleCourseSelection, onOpenStudyIncrementSettings, onStopTask, onToggleExpandCourse, onToggleFullCourseOutline, onTaskFilterChange, onRefreshTasks, onSettingSwitch, onWorkAutoSubmitChange, onExamAutoSubmitChange, onSignStatusChange }: DashboardMainContentProps) {
  return (
    <main ref={mainRef} id="dashboard-main" className="min-h-0 flex-1 overflow-x-clip overflow-y-auto pb-18 lg:pb-0">
      <div className="mx-auto w-full min-w-0 px-0 py-0 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 lg:py-6">
        <div className="min-w-0">
          {activeTab === 'courses' && <CourseProgressSummary visibleCount={courses.length - hiddenEmptyTaskCourseCount} incompleteCount={incompleteSelectableCourses.length} activeTaskCount={taskCounts.active} />}
          <CourseListSection accountId={accountId} courses={courses} filteredCourses={filteredCourses} coursesLoading={coursesLoading} courseSearch={courseSearch} courseSearchQuery={courseSearchQuery} selectableCourses={selectableCourses} incompleteSelectableCourses={incompleteSelectableCourses} isAllSelected={isAllSelected} isSomeSelected={isSomeSelected} isAllIncompleteSelected={isAllIncompleteSelected} selectedCourses={selectedCourses} expandedCourses={expandedCourses} fullyExpandedCourseOutlines={fullyExpandedCourseOutlines} courseDetailsMap={courseDetailsMap} loadingDetails={loadingDetails} stoppingTaskId={stoppingTaskId} studyIncrements={studyIncrements} defaultStudyIncrement={defaultStudyIncrement} onRefresh={onRefreshCourses} onSearchChange={onSearchChange} onSearchQueryChange={onSearchQueryChange} onToggleSelectAll={onToggleSelectAll} onToggleSelectIncomplete={onToggleSelectIncomplete} onToggleCourseSelection={onToggleCourseSelection} onOpenStudyIncrementSettings={onOpenStudyIncrementSettings} onStopTask={onStopTask} onToggleExpandCourse={onToggleExpandCourse} onToggleFullCourseOutline={onToggleFullCourseOutline} />
          <TabsContent value="sign" className="m-0 outline-none">
            <Card className="rounded-none border-none bg-card py-0 shadow-none ring-0 sm:rounded-xl sm:py-4 sm:shadow-sm lg:py-0">
              <CardHeader className="rounded-none border-b border-border/50 px-3 py-2.5 sm:px-6 sm:py-4 lg:hidden"><CardTitle className="text-sm font-semibold sm:text-base">自动签到</CardTitle></CardHeader>
              <CardContent className="p-3 text-sm sm:p-6">{accountId && <SignMonitor accountId={accountId} onUnauthorized={onUnauthorized} onStatusChange={onSignStatusChange} />}</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings" className="m-0 outline-none"><TaskSettingsPanel hiddenEmptyTaskCourseCount={hiddenEmptyTaskCourseCount} hideEmptyTaskCourses={hideEmptyTaskCourses} bypassDailyStudyLimit={bypassDailyStudyLimit} doChapterTest={doChapterTest} doWork={doWork} workAutoSubmit={workAutoSubmit} doExam={doExam} examAutoSubmit={examAutoSubmit} onUnauthorized={onUnauthorized} onSettingSwitch={onSettingSwitch} onWorkAutoSubmitChange={onWorkAutoSubmitChange} onExamAutoSubmitChange={onExamAutoSubmitChange} /></TabsContent>
          <TabsContent value="tasks" className="m-0 outline-none lg:hidden"><Card className="min-w-0 overflow-hidden rounded-none border-none bg-card py-0 shadow-none ring-0 sm:rounded-xl sm:py-4 sm:shadow-sm sm:ring-0"><CardHeader className="rounded-none border-b border-border/50 px-3 py-2.5 sm:px-6 sm:py-4"><CardTitle className="text-sm font-semibold sm:text-base">任务</CardTitle><CardDescription className="text-xs">查看任务运行状态与进度</CardDescription></CardHeader><CardContent className="flex min-h-0 min-w-0 flex-col p-0"><TaskStatusContent tasks={tasks} filteredTasks={filteredTasks} taskCounts={taskCounts} taskFilter={taskFilter} tasksLoading={tasksLoading} taskSnapshots={taskSnapshots} courseNameByIdentifier={courseNameByIdentifier} courseTaskPointProgressByIdentifier={courseTaskPointProgressByIdentifier} onTaskFilterChange={onTaskFilterChange} onRefresh={onRefreshTasks} onStopTask={onStopTask} /></CardContent></Card></TabsContent>
        </div>
      </div>
    </main>
  );
}
