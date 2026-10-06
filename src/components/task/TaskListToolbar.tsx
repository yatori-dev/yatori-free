import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Task, TaskKind } from '@/lib/api';
import { isActiveTaskStatus } from '@/lib/taskStatus';
import { taskStatusLabels } from '@/lib/taskDashboard';
import { MotionHighlight } from '@/components/ui/motion-highlight';

export type TaskListStatus = 'all' | 'attention' | Task['status'];
export type TaskListKind = 'all' | TaskKind;
export type TaskListSort = 'newest' | 'oldest';

interface TaskListToolbarProps {
  taskFilter: 'active' | 'completed';
  counts: { active: number; completed: number };
  search: string;
  status: TaskListStatus;
  kind: TaskListKind;
  sort: TaskListSort;
  onTabChange: (value: 'active' | 'completed') => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: TaskListStatus) => void;
  onKindChange: (value: TaskListKind) => void;
  onSortChange: (value: TaskListSort) => void;
}

export function TaskListToolbar({
  taskFilter, counts, search, status, kind, sort,
  onTabChange, onSearchChange, onStatusChange, onKindChange, onSortChange,
}: TaskListToolbarProps) {
  const statuses = (Object.keys(taskStatusLabels) as Task['status'][])
    .filter((value) => isActiveTaskStatus(value) === (taskFilter === 'active'));

  return (
    <div className="space-y-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">任务列表</h3>
        <div className="motion-highlight-host relative inline-flex shrink-0 gap-1 rounded-[var(--radius-md)] bg-muted p-1" data-motion-segment role="group" aria-label="任务状态分组">
          <MotionHighlight selector='[aria-pressed="true"]' />
          {(['active', 'completed'] as const).map((value) => (
            <Button key={value} variant="ghost" size="sm" onClick={() => onTabChange(value)} aria-pressed={taskFilter === value} className={`h-8 gap-2 px-3 text-xs ${taskFilter === value ? 'bg-background text-foreground hover:bg-background' : 'text-muted-foreground'}`}>
              {value === 'active' ? '进行中' : '已结束'}<span className="tabular-nums">{counts[value]}</span>
            </Button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 basis-full sm:max-w-80 sm:basis-64 sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="搜索课程或任务编号" aria-label="搜索课程或任务编号" className="pr-9 pl-9" />
          {search && (
            <Button variant="ghost" size="icon" className="absolute top-0.5 right-0.5 h-8 w-8" aria-label="清除搜索" title="清除搜索" onClick={() => onSearchChange('')}><X className="h-3.5 w-3.5" /></Button>
          )}
        </div>
        <Select value={status} onValueChange={(value) => onStatusChange(value as TaskListStatus)}>
          <SelectTrigger className="h-9 w-36" aria-label="筛选任务状态"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {taskFilter === 'completed' && <SelectItem value="attention">需关注</SelectItem>}
            {statuses.map((value) => <SelectItem key={value} value={value}>{taskStatusLabels[value]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={kind} onValueChange={(value) => onKindChange(value as TaskListKind)}>
          <SelectTrigger className="h-9 w-28" aria-label="筛选任务类型"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="task_points">章节任务</SelectItem>
            <SelectItem value="works">作业</SelectItem>
            <SelectItem value="exams">考试</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => onSortChange(value as TaskListSort)}>
          <SelectTrigger className="h-9 w-28 sm:ml-auto" aria-label="任务排序"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">最新创建</SelectItem>
            <SelectItem value="oldest">最早创建</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
