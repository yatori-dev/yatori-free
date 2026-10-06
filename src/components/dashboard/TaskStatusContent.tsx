import { lazy, Suspense, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskInlineItem } from '@/components/TaskInlineItem';
import { TaskChartsSkeleton } from '@/components/task/TaskChartsSkeleton';
import { TaskListToolbar, type TaskListKind, type TaskListSort, type TaskListStatus } from '@/components/task/TaskListToolbar';
import { getTaskGroup, type TaskGroup } from '@/lib/taskDashboard';
import { getTaskConfigSnapshot, getTaskCourseIdentifiers, type Task } from '@/lib/api';
import type { TaskProgressSnapshot } from '@/hooks/useTaskProgressPolling';
import type { CourseTaskPointProgressMap } from '@/lib/taskProgress';
import { getTaskCreatedTime, getTaskPresentation } from '@/lib/taskPresentation';
import { isActiveTaskStatus } from '@/lib/taskStatus';

const TaskDashboardCharts = lazy(() => import('@/components/task/TaskDashboardCharts'));
const PAGE_SIZE = 10;

interface TaskStatusContentProps {
  tasks: Task[];
  taskFilter: 'active' | 'completed';
  tasksLoading: boolean;
  taskSnapshots: Record<string, TaskProgressSnapshot>;
  courseNameByIdentifier: Record<string, string>;
  courseTaskPointProgressByIdentifier: CourseTaskPointProgressMap;
  onTaskFilterChange: (filter: 'active' | 'completed') => void;
  onRefresh: () => void;
  onStopTask: (taskId: string) => void;
}

export function TaskStatusContent({
  tasks, taskFilter, tasksLoading, taskSnapshots, courseNameByIdentifier,
  courseTaskPointProgressByIdentifier, onTaskFilterChange, onRefresh, onStopTask,
}: TaskStatusContentProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TaskListStatus>('all');
  const [kind, setKind] = useState<TaskListKind>('all');
  const [sort, setSort] = useState<TaskListSort>('newest');
  const [page, setPage] = useState(1);
  const effectiveTasks = tasks.map((task) => {
    const presentation = getTaskPresentation(task, taskSnapshots[task.id]);
    return { ...task, ...presentation, progress: presentation.progress ?? undefined };
  });
  const activeCount = effectiveTasks.filter((task) => isActiveTaskStatus(task.status)).length;
  const query = search.trim().toLocaleLowerCase();
  const matchingTasks = tasks.filter((task, index) => {
    const effectiveTask = effectiveTasks[index];
    if (isActiveTaskStatus(effectiveTask.status) !== (taskFilter === 'active')) return false;
    if (status === 'attention') {
      if (getTaskGroup(effectiveTask.status) !== 'attention') return false;
    } else if (status !== 'all' && effectiveTask.status !== status) {
      return false;
    }
    if (kind !== 'all' && getTaskConfigSnapshot(effectiveTask.configSnapshot)?.kind !== kind) return false;
    if (!query) return true;
    const courses = getTaskCourseIdentifiers(effectiveTask.configSnapshot) ?? [];
    const searchableText = [task.id, effectiveTask.progress?.currentCourse, ...courses.map((identifier) => courseNameByIdentifier[identifier.trim()] ?? identifier)];
    return searchableText.some((value) => value?.toLocaleLowerCase().includes(query));
  }).sort((left, right) => {
    const difference = getTaskCreatedTime(left) - getTaskCreatedTime(right);
    return sort === 'newest' ? -difference : difference;
  });
  const pageCount = Math.max(1, Math.ceil(matchingTasks.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageTasks = matchingTasks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const changeTab = (value: 'active' | 'completed') => {
    onTaskFilterChange(value);
    setStatus('all');
    setPage(1);
  };
  const selectGroup = (group: TaskGroup) => {
    changeTab(group === 'active' ? 'active' : 'completed');
    setStatus(group === 'active' ? 'all' : group === 'attention' ? 'attention' : group);
    setKind('all');
    setSearch('');
  };
  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setKind('all');
    setPage(1);
  };
  const hasFilters = Boolean(query) || status !== 'all' || kind !== 'all';

  return (
    <div className="min-w-0" aria-busy={tasksLoading}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <h2 className="text-xl font-semibold">任务</h2>
          {tasks.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{activeCount > 0 ? `${activeCount} 项进行中` : '当前没有进行中的任务'}</p>}
        </div>
        <Button size="sm" variant="outline" disabled={tasksLoading} onClick={onRefresh} className="h-9 gap-2" title="刷新任务列表">
          <RefreshCw className={`h-4 w-4 ${tasksLoading ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
          刷新
        </Button>
      </header>
      {tasksLoading && tasks.length === 0 ? (
        <TaskChartsSkeleton />
      ) : tasks.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
          <Activity className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">暂无任务</p>
        </div>
      ) : (
        <>
          <Suspense fallback={<TaskChartsSkeleton />}>
            <TaskDashboardCharts tasks={effectiveTasks} onSelectGroup={selectGroup} />
          </Suspense>
          <TaskListToolbar taskFilter={taskFilter} counts={{ active: activeCount, completed: tasks.length - activeCount }} search={search} status={status} kind={kind} sort={sort}
            onTabChange={changeTab}
            onSearchChange={(value) => { setSearch(value); setPage(1); }}
            onStatusChange={(value) => { setStatus(value); setPage(1); }}
            onKindChange={(value) => { setKind(value); setPage(1); }}
            onSortChange={(value) => { setSort(value); setPage(1); }} />
          <div className="min-w-0 border-t border-border">
            {pageTasks.length > 0 ? pageTasks.map((task) => (
              <TaskInlineItem key={task.id} task={task} snapshot={taskSnapshots[task.id]} courseNameByIdentifier={courseNameByIdentifier} courseTaskPointProgressByIdentifier={courseTaskPointProgressByIdentifier} onStopTask={onStopTask} />
            )) : (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 px-4 text-center">
                <p className="text-sm text-muted-foreground">{hasFilters ? '没有匹配的任务' : taskFilter === 'active' ? '暂无进行中的任务' : '暂无已结束的任务'}</p>
                <Button variant="outline" size="sm" onClick={hasFilters ? resetFilters : () => changeTab(taskFilter === 'active' ? 'completed' : 'active')}>
                  {hasFilters ? '清除筛选' : taskFilter === 'active' ? '查看已结束' : '查看进行中'}
                </Button>
              </div>
            )}
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 py-4 text-xs text-muted-foreground">
            <span role="status">共 {matchingTasks.length} 项{matchingTasks.length > 0 ? ` · 显示 ${(currentPage - 1) * PAGE_SIZE + 1} - ${Math.min(currentPage * PAGE_SIZE, matchingTasks.length)} 项` : ''}</span>
            {pageCount > 1 && <div className="flex items-center gap-2">
              <span className="mr-1 tabular-nums">第 {currentPage} / {pageCount} 页</span>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="上一页" title="上一页"><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="下一页" title="下一页"><ChevronRight className="h-4 w-4" /></Button>
            </div>}
          </footer>
        </>
      )}
    </div>
  );
}
