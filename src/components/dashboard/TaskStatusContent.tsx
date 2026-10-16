import { lazy, Suspense, useEffect, useEffectEvent, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineError } from '@/components/common/InlineError';
import { TaskInlineItem } from '@/components/TaskInlineItem';
import { TaskChartsSkeleton } from '@/components/task/TaskChartsSkeleton';
import { TaskListToolbar, type TaskListKind, type TaskListSort, type TaskListStatus } from '@/components/task/TaskListToolbar';
import { type TaskGroup } from '@/lib/taskDashboard';
import { getTasks, getTaskStats, getUserFacingErrorMessage, isAuthExitError, type Task, type TaskStats } from '@/lib/api';
import { useTaskProgressPolling, type TaskProgressSnapshot } from '@/hooks/useTaskProgressPolling';
import type { CourseTaskPointProgressMap } from '@/lib/taskProgress';
import { ACTIVE_TASK_STATUSES, isActiveTaskStatus, isTerminalTaskStatus } from '@/lib/taskStatus';

const TaskDashboardCharts = lazy(() => import('@/components/task/TaskDashboardCharts'));
const PAGE_SIZE = 10;
const ignoreUnauthorized = () => {};

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
  onUnauthorized?: () => void;
  visible?: boolean;
}

export function TaskStatusContent({
  tasks, taskFilter, tasksLoading, taskSnapshots, courseNameByIdentifier,
  courseTaskPointProgressByIdentifier, onTaskFilterChange, onRefresh, onStopTask,
  onUnauthorized = ignoreUnauthorized, visible = true,
}: TaskStatusContentProps) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TaskListStatus>('all');
  const [kind, setKind] = useState<TaskListKind>('all');
  const [sort, setSort] = useState<TaskListSort>('newest');
  const [page, setPage] = useState(1);
  const [pageTasks, setPageTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [statsError, setStatsError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [loadedQueryKey, setLoadedQueryKey] = useState('');
  const queryKey = JSON.stringify([taskFilter, status, kind, query, sort, page]);
  const hasCurrentPage = loadedQueryKey === queryKey;
  const pageSnapshots = useTaskProgressPolling({ tasks: pageTasks, onUnauthorized, enabled: visible && hasCurrentPage && !listError });
  const snapshots = { ...taskSnapshots, ...pageSnapshots };
  const taskChangeKey = tasks.map((task) => `${task.id}:${task.status}`).sort().join('|');
  const snapshotChangeKey = pageTasks.filter((task) => isActiveTaskStatus(task.status) && isTerminalTaskStatus(pageSnapshots[task.id]?.status ?? task.status)).map((task) => `${task.id}:${pageSnapshots[task.id].status}`).sort().join('|');
  const activeCount = stats ? ACTIVE_TASK_STATUSES.reduce((count, value) => count + (stats.statusCounts[value] ?? 0), 0) : 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const loading = listLoading || tasksLoading;
  const hasFilters = Boolean(query) || status !== 'all' || kind !== 'all';

  useEffect(() => {
    if (query === search.trim()) return;
    const timer = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, query]);

  const loadPage = useEffectEvent(async (controller: AbortController) => {
    setListLoading(true);
    setListError('');
    try {
      const response = await getTasks({
        group: taskFilter,
        status: status === 'all' ? undefined : status,
        kind: kind === 'all' ? undefined : kind,
        q: query || undefined,
        sort, page, pageSize: PAGE_SIZE,
      }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setPageTasks(response.data.tasks);
      setTotal(response.data.total);
      setLoadedQueryKey(queryKey);
      const lastPage = Math.max(1, Math.ceil(response.data.total / PAGE_SIZE));
      if (page > lastPage) setPage(lastPage);
    } catch (error) {
      if (controller.signal.aborted) return;
      if (isAuthExitError(error)) onUnauthorized();
      setListError(getUserFacingErrorMessage(error, '获取任务列表失败'));
    } finally {
      if (!controller.signal.aborted) setListLoading(false);
    }
  });

  const loadStats = useEffectEvent(async (controller: AbortController) => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const response = await getTaskStats({ signal: controller.signal });
      if (!controller.signal.aborted) setStats(response.data);
    } catch (error) {
      if (controller.signal.aborted) return;
      if (isAuthExitError(error)) onUnauthorized();
      setStatsError(getUserFacingErrorMessage(error, '获取任务统计失败'));
    } finally {
      if (!controller.signal.aborted) setStatsLoading(false);
    }
  });

  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadPage(controller), 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [taskFilter, status, kind, query, sort, page, refreshVersion, taskChangeKey, snapshotChangeKey, visible]);

  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadStats(controller), 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [refreshVersion, taskChangeKey, snapshotChangeKey, visible]);

  const refresh = () => {
    setRefreshVersion((value) => value + 1);
    onRefresh();
  };
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
    setQuery('');
  };
  const resetFilters = () => {
    setSearch('');
    setQuery('');
    setStatus('all');
    setKind('all');
    setPage(1);
  };

  return (
    <div className="min-w-0" aria-busy={loading}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <h2 className="text-xl font-semibold">任务</h2>
          {stats && <p className="mt-1 text-xs text-muted-foreground">{activeCount > 0 ? `${activeCount} 项进行中` : '当前没有进行中的任务'}</p>}
        </div>
        <Button size="sm" variant="outline" disabled={loading || statsLoading} onClick={refresh} className="h-9 gap-2" title="刷新任务列表">
          <RefreshCw className={`h-4 w-4 ${loading || statsLoading ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
          刷新
        </Button>
      </header>
      {statsError ? (
        <div className="py-4"><InlineError title="任务统计加载失败">{statsError}<Button variant="link" size="sm" className="ml-2 h-auto p-0 text-current" onClick={refresh}>重试</Button></InlineError></div>
      ) : stats ? (
        <Suspense fallback={<TaskChartsSkeleton />}>
          <TaskDashboardCharts stats={stats} onSelectGroup={selectGroup} />
        </Suspense>
      ) : <TaskChartsSkeleton />}
      <TaskListToolbar taskFilter={taskFilter} counts={{ active: activeCount, completed: Math.max(0, (stats?.total ?? 0) - activeCount) }} search={search} status={status} kind={kind} sort={sort}
        onTabChange={changeTab}
        onSearchChange={setSearch}
        onStatusChange={(value) => { setStatus(value); setPage(1); }}
        onKindChange={(value) => { setKind(value); setPage(1); }}
        onSortChange={(value) => { setSort(value); setPage(1); }} />
      <div className="min-w-0 border-t border-border">
        {listError ? (
          <div className="py-4"><InlineError title="任务列表加载失败">{listError}<Button variant="link" size="sm" className="ml-2 h-auto p-0 text-current" onClick={refresh}>重试</Button></InlineError></div>
        ) : !hasCurrentPage ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground" role="status"><RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />正在加载任务</div>
        ) : pageTasks.length > 0 ? pageTasks.map((task) => (
          <TaskInlineItem key={task.id} task={task} snapshot={snapshots[task.id]} courseNameByIdentifier={courseNameByIdentifier} courseTaskPointProgressByIdentifier={courseTaskPointProgressByIdentifier} onStopTask={onStopTask} onUnauthorized={onUnauthorized} />
        )) : (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 px-4 text-center">
            <Activity className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{hasFilters ? '没有匹配的任务' : taskFilter === 'active' ? '暂无进行中的任务' : '暂无已结束的任务'}</p>
            <Button variant="outline" size="sm" onClick={hasFilters ? resetFilters : () => changeTab(taskFilter === 'active' ? 'completed' : 'active')}>
              {hasFilters ? '清除筛选' : taskFilter === 'active' ? '查看已结束' : '查看进行中'}
            </Button>
          </div>
        )}
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 py-4 text-xs text-muted-foreground">
        <span role="status">{listError ? '列表未更新' : !hasCurrentPage ? '正在加载' : `共 ${total} 项${total > 0 ? ` · 显示 ${(page - 1) * PAGE_SIZE + 1} - ${Math.min(page * PAGE_SIZE, total)} 项` : ''}`}</span>
        {pageCount > 1 && <div className="flex items-center gap-2">
          <span className="mr-1 tabular-nums">第 {page} / {pageCount} 页</span>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={loading || page === 1} onClick={() => setPage(page - 1)} aria-label="上一页" title="上一页"><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={loading || page >= pageCount} onClick={() => setPage(page + 1)} aria-label="下一页" title="下一页"><ChevronRight className="h-4 w-4" /></Button>
        </div>}
      </footer>
    </div>
  );
}
