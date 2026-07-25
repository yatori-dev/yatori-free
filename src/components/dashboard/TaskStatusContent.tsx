import { Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskInlineItem } from '@/components/TaskInlineItem';
import type { Task } from '@/lib/api';
import type { TaskProgressSnapshot } from '@/hooks/useTaskProgressPolling';

type TaskFilter = 'active' | 'completed';

interface TaskStatusContentProps {
  tasks: Task[];
  filteredTasks: Task[];
  taskCounts: { active: number; completed: number };
  taskFilter: TaskFilter;
  tasksLoading: boolean;
  taskSnapshots: Record<string, TaskProgressSnapshot>;
  courseNameByIdentifier: Record<string, string>;
  onTaskFilterChange: (filter: TaskFilter) => void;
  onRefresh: () => void;
  onStopTask: (taskId: string) => void;
}

export function TaskStatusContent({
  tasks,
  filteredTasks,
  taskCounts,
  taskFilter,
  tasksLoading,
  taskSnapshots,
  courseNameByIdentifier,
  onTaskFilterChange,
  onRefresh,
  onStopTask,
}: TaskStatusContentProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-3 py-1.5 sm:px-5 sm:py-3">
        {tasks.length > 0 ? (
          <div className="flex min-w-0 gap-5 overflow-x-auto no-scrollbar" role="group" aria-label="任务状态筛选">
            {[
              { id: 'active' as const, label: '进行中', count: taskCounts.active },
              { id: 'completed' as const, label: '已结束', count: taskCounts.completed },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => onTaskFilterChange(filter.id)}
                className={`relative flex min-h-9 shrink-0 items-center gap-1.5 px-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-11 ${
                  taskFilter === filter.id
                    ? 'text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-pressed={taskFilter === filter.id}
              >
                {filter.label}
                <span className="text-xs font-normal tabular-nums text-muted-foreground">
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">任务状态</span>
        )}
        <Button
          size="icon"
          variant="ghost"
          disabled={tasksLoading}
          onClick={onRefresh}
          className="h-8 w-8 shrink-0 rounded-md sm:h-9 sm:w-9"
          aria-label="刷新任务列表"
        >
          <RefreshCw className={`h-4 w-4 ${tasksLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {tasksLoading && tasks.length === 0 ? (
          <div className="flex h-full min-h-56 items-center justify-center p-8 text-sm text-muted-foreground">
            获取任务状态中...
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex h-full min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Activity className="h-6 w-6 stroke-[1.5]" />
            </div>
            <p className="text-xs text-muted-foreground">暂无历史任务</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex h-full min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Activity className="h-6 w-6 stroke-[1.5]" />
            </div>
            <p className="text-xs text-muted-foreground">
              {taskFilter === 'active' ? '暂无进行中的任务' : '暂无已结束的任务'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTaskFilterChange(taskFilter === 'active' ? 'completed' : 'active')}
              className="h-9 text-xs"
            >
              {taskFilter === 'active' ? '查看已结束' : '查看进行中'}
            </Button>
          </div>
        ) : (
          <div className="flex min-w-0 flex-col gap-2 p-2.5 sm:gap-3 sm:p-4">
            {filteredTasks.map((task) => (
              <TaskInlineItem
                key={task.id}
                task={task}
                snapshot={taskSnapshots[task.id]}
                courseNameByIdentifier={courseNameByIdentifier}
                onStopTask={onStopTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
