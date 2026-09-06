import { ChevronDown, LogOut } from 'lucide-react';
import { ThemeToggleButton } from './ThemeToggleButton';
import { TaskStatusDrawer } from './TaskStatusDrawer';
import { TaskStatusContent } from './TaskStatusContent';
import { BrandMark } from '@/components/BrandMark';
import type { Task } from '@/lib/api';
import type { TaskProgressSnapshot } from '@/hooks/useTaskProgressPolling';
import type { CourseTaskPointProgressMap } from '@/lib/taskProgress';
import { QQ_LOGO_URL, YATORI_QQ_GROUP_URL, YATORI_REPOSITORY_URL } from '@/lib/externalLinks';

interface DashboardHeaderProps {
  title: string;
  appVersion: string;
  session: { displayName: string; user: { username: string }; avatarUrl?: string | null };
  taskDrawerOpen: boolean;
  accountMenuOpen: boolean;
  taskCounts: { active: number; completed: number };
  tasks: Task[];
  filteredTasks: Task[];
  taskFilter: 'active' | 'completed';
  tasksLoading: boolean;
  taskSnapshots: Record<string, TaskProgressSnapshot>;
  courseNameByIdentifier: Record<string, string>;
  courseTaskPointProgressByIdentifier: CourseTaskPointProgressMap;
  onTaskDrawerChange: (open: boolean) => void;
  onAccountMenuChange: (open: boolean) => void;
  onTaskFilterChange: (filter: 'active' | 'completed') => void;
  onRefreshTasks: () => void;
  onStopTask: (taskId: string) => void;
  onLogoutRequest: () => void;
}

export function DashboardHeader({ title, appVersion, session, taskDrawerOpen, accountMenuOpen, taskCounts, tasks, filteredTasks, taskFilter, tasksLoading, taskSnapshots, courseNameByIdentifier, courseTaskPointProgressByIdentifier, onTaskDrawerChange, onAccountMenuChange, onTaskFilterChange, onRefreshTasks, onStopTask, onLogoutRequest }: DashboardHeaderProps) {
  return <header className="sticky top-0 z-40 flex min-h-14 items-center justify-between gap-1.5 border-b border-border bg-card px-2.5 py-1.5 shadow-sm sm:min-h-16 sm:gap-2 sm:px-6 sm:py-2.5 lg:px-8">
    <div className="flex min-w-0 shrink-0 items-center lg:hidden"><a href={YATORI_REPOSITORY_URL} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1.5 rounded-md font-semibold leading-none tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`在 GitHub 查看 Yatori 学习通服务 v${appVersion} 源码`}><BrandMark className="text-xl sm:text-2xl" /><span className="flex flex-col gap-0.5 whitespace-nowrap"><span className="text-[10px] font-semibold text-foreground/80 sm:text-sm">学习通服务</span><span className="text-[10px] font-medium tabular-nums text-muted-foreground sm:text-xs">v{appVersion}</span></span></a></div>
    <h1 className="hidden min-w-0 truncate text-base font-semibold text-foreground lg:block">{title}</h1>
    <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-4"><ThemeToggleButton /><TaskStatusDrawer open={taskDrawerOpen} activeTaskCount={taskCounts.active} onOpenChange={onTaskDrawerChange} trigger={undefined}><TaskStatusContent tasks={tasks} filteredTasks={filteredTasks} taskCounts={taskCounts} taskFilter={taskFilter} tasksLoading={tasksLoading} taskSnapshots={taskSnapshots} courseNameByIdentifier={courseNameByIdentifier} courseTaskPointProgressByIdentifier={courseTaskPointProgressByIdentifier} onTaskFilterChange={onTaskFilterChange} onRefresh={onRefreshTasks} onStopTask={onStopTask} /></TaskStatusDrawer><div className="relative"><button type="button" onClick={() => onAccountMenuChange(!accountMenuOpen)} className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 text-left shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-3 sm:px-3" aria-expanded={accountMenuOpen} aria-label={`当前用户 ${session.displayName}`}>
      {session.avatarUrl ? <img src={session.avatarUrl} alt="头像" className="h-6 w-6 rounded-full object-cover ring-1 ring-border sm:h-7 sm:w-7" referrerPolicy="no-referrer" /> : <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground sm:h-7 sm:w-7 sm:text-xs">{session.displayName.substring(0, 1).toUpperCase()}</div>}
      <div className="hidden min-w-0 flex-col text-left min-[360px]:flex"><span className="max-w-[68px] truncate text-[11px] font-bold min-[400px]:max-w-none sm:max-w-[100px] sm:text-xs sm:font-semibold">{session.displayName}</span><span className="hidden max-w-[100px] truncate text-xs text-muted-foreground sm:block">{session.user.username}</span></div><ChevronDown className={`size-4 text-muted-foreground transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} /></button>
      {accountMenuOpen && <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-52 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-floating animate-in fade-in-0 zoom-in-95"><div className="border-b border-border/70 px-3 pb-2 pt-1"><p className="truncate text-sm font-semibold">{session.displayName}</p><p className="truncate text-xs text-muted-foreground">{session.user.username}</p></div><a href={YATORI_QQ_GROUP_URL} target="_blank" rel="noreferrer" onClick={() => onAccountMenuChange(false)} className="mt-1 flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden" aria-label="加入QQ群组"><img src={QQ_LOGO_URL} alt="" className="size-4 object-contain" />QQ群组</a><a href={YATORI_REPOSITORY_URL} target="_blank" rel="noreferrer" onClick={() => onAccountMenuChange(false)} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden" aria-label="查看 GitHub 仓库"><svg className="size-4" aria-hidden="true"><use href="/icons.svg#github-icon" /></svg>GitHub 仓库</a><button type="button" onClick={() => { onAccountMenuChange(false); onLogoutRequest(); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-sm text-destructive transition-colors hover:bg-destructive/10"><LogOut className="size-4" />退出登录</button></div>}
    </div></div>
  </header>;
}
