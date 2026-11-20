import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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
  const activeFilterCount =
    (status !== 'all' ? 1 : 0) +
    (kind !== 'all' ? 1 : 0) +
    (sort !== 'newest' ? 1 : 0);

  return (
    <div className="space-y-3 py-4 sm:space-y-4 sm:py-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">任务列表</h3>
        <div className="motion-highlight-host relative inline-flex shrink-0 gap-1 rounded-[var(--radius-md)] bg-muted p-1" data-motion-segment role="group" aria-label="任务状态分组">
          <MotionHighlight selector='[aria-pressed="true"]' />
          {(['active', 'completed'] as const).map((value) => (
            <Button key={value} variant="ghost" size="sm" onClick={() => onTabChange(value)} aria-pressed={taskFilter === value} className={`h-8 gap-1.5 px-2.5 text-xs sm:gap-2 sm:px-3 ${taskFilter === value ? 'bg-background text-foreground hover:bg-background' : 'text-muted-foreground'}`}>
              {value === 'active' ? '进行中' : '已结束'}<span className="tabular-nums">{counts[value]}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="搜索课程或任务编号" aria-label="搜索课程或任务编号" className="pr-9 pl-9" />
          {search && (
            <Button variant="ghost" size="icon" className="absolute top-0.5 right-0.5 h-8 w-8" aria-label="清除搜索" title="清除搜索" onClick={() => onSearchChange('')}><X className="h-3.5 w-3.5" /></Button>
          )}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0 gap-1.5 px-3 sm:hidden"
              aria-label="筛选与排序"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>筛选</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader className="shrink-0 pt-[max(1rem,env(safe-area-inset-top))]">
              <div>
                <SheetTitle>筛选与排序</SheetTitle>
                <SheetDescription>按状态、类型或创建时间筛选任务</SheetDescription>
              </div>
              <SheetClose asChild>
                <Button type="button" variant="ghost" size="icon" className="size-11 shrink-0" aria-label="关闭筛选抽屉">
                  <X className="size-4" />
                </Button>
              </SheetClose>
            </SheetHeader>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <div className="space-y-2">
                <Label htmlFor="mobile-task-status" className="text-sm font-medium">任务状态</Label>
                <Select value={status} onValueChange={(value) => onStatusChange(value as TaskListStatus)}>
                  <SelectTrigger id="mobile-task-status" className="h-10 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    {taskFilter === 'completed' && <SelectItem value="attention">需关注</SelectItem>}
                    {statuses.map((value) => <SelectItem key={value} value={value}>{taskStatusLabels[value]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile-task-kind" className="text-sm font-medium">任务类型</Label>
                <Select value={kind} onValueChange={(value) => onKindChange(value as TaskListKind)}>
                  <SelectTrigger id="mobile-task-kind" className="h-10 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="task_points">章节任务</SelectItem>
                    <SelectItem value="works">作业</SelectItem>
                    <SelectItem value="exams">考试</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile-task-sort" className="text-sm font-medium">排序方式</Label>
                <Select value={sort} onValueChange={(value) => onSortChange(value as TaskListSort)}>
                  <SelectTrigger id="mobile-task-sort" className="h-10 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">最新创建</SelectItem>
                    <SelectItem value="oldest">最早创建</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {activeFilterCount > 0 && (
                <div className="border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full"
                    onClick={() => {
                      onStatusChange('all');
                      onKindChange('all');
                      onSortChange('newest');
                    }}
                  >
                    重置筛选条件
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <div className="hidden items-center gap-2 sm:flex sm:flex-1">
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
    </div>
  );
}
