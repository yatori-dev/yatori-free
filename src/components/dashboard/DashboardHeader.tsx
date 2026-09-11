import { ChevronDown, LogOut } from 'lucide-react';
import { ThemeToggleButton } from './ThemeToggleButton';
import { BrandMark } from '@/components/BrandMark';
import type { Task } from '@/lib/api';
import type { TaskProgressSnapshot } from '@/hooks/useTaskProgressPolling';
import type { CourseTaskPointProgressMap } from '@/lib/taskProgress';
import { QQ_LOGO_URL, YATORI_QQ_GROUP_URL, YATORI_REPOSITORY_URL } from '@/lib/externalLinks';

interface DashboardHeaderProps {
  title: string;
  appVersion: string;
  session: { displayName: string; user: { username: string }; avatarUrl?: string | null };
  accountMenuOpen: boolean;
  taskCounts: { active: number; completed: number };
  tasks: Task[];
  filteredTasks: Task[];
  taskFilter: 'active' | 'completed';
  tasksLoading: boolean;
  taskSnapshots: Record<string, TaskProgressSnapshot>;
  courseNameByIdentifier: Record<string, string>;
  courseTaskPointProgressByIdentifier: CourseTaskPointProgressMap;
  onAccountMenuChange: (open: boolean) => void;
  onTaskFilterChange: (filter: 'active' | 'completed') => void;
  onRefreshTasks: () => void;
  onStopTask: (taskId: string) => void;
  onLogoutRequest: () => void;
}

export function DashboardHeader({ title, appVersion, session, accountMenuOpen, onAccountMenuChange, onLogoutRequest }: DashboardHeaderProps) {
  return <header className="sticky top-0 z-40 flex min-h-14 items-center justify-between gap-1.5 border-b border-border/70 bg-card/95 backdrop-blur-md px-2.5 py-1.5 shadow-xs sm:min-h-16 sm:gap-2 sm:px-6 sm:py-2.5 lg:px-8">
    <div className="flex min-w-0 shrink-0 items-center lg:hidden"><a href={YATORI_REPOSITORY_URL} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-baseline gap-1.5 rounded-md font-semibold leading-none tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`在 GitHub 查看 Yatori 学习通服务 v${appVersion} 源码`}><BrandMark className="text-xl sm:text-2xl" /><span className="inline-flex items-baseline gap-1 whitespace-nowrap text-xs"><span className="font-semibold text-foreground/80 sm:text-sm">学习通服务</span><span className="font-medium tabular-nums text-muted-foreground">v{appVersion}</span></span></a></div>
    <h1 className="hidden min-w-0 truncate text-base font-semibold text-foreground lg:block">{title}</h1>
    <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-4"><ThemeToggleButton /><div className="relative"><button type="button" onClick={() => onAccountMenuChange(!accountMenuOpen)} className="flex min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-card px-2 py-1.5 text-left shadow-xs transition-all duration-150 ease-standard hover:bg-muted/70 hover:border-border active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-3 sm:px-3" aria-expanded={accountMenuOpen} aria-label={`当前用户 ${session.displayName}`}>
      {session.avatarUrl ? <img src={session.avatarUrl} alt="头像" className="h-6 w-6 rounded-full object-cover ring-1 ring-border sm:h-7 sm:w-7" referrerPolicy="no-referrer" /> : <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground sm:h-7 sm:w-7 sm:text-xs">{session.displayName.substring(0, 1).toUpperCase()}</div>}
      <div className="hidden min-w-0 flex-col text-left min-[360px]:flex"><span className="max-w-[68px] truncate text-[11px] font-bold min-[400px]:max-w-none sm:max-w-[100px] sm:text-xs sm:font-semibold">{session.displayName}</span><span className="hidden max-w-[100px] truncate text-xs text-muted-foreground sm:block">{session.user.username}</span></div><ChevronDown className={`size-4 text-muted-foreground transition-transform duration-200 ease-standard ${accountMenuOpen ? 'rotate-180' : ''}`} /></button>
      {accountMenuOpen && <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-52 rounded-xl border border-border/70 bg-popover/95 p-1.5 text-popover-foreground shadow-floating backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-150"><div className="border-b border-border/50 px-3 pb-2 pt-1"><p className="truncate text-sm font-semibold">{session.displayName}</p><p className="truncate text-xs text-muted-foreground">{session.user.username}</p></div><a href={YATORI_QQ_GROUP_URL} target="_blank" rel="noreferrer" onClick={() => onAccountMenuChange(false)} className="mt-1 flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.99] lg:hidden" aria-label="加入QQ群组"><img src={QQ_LOGO_URL} alt="" className="size-4 object-contain" />QQ群组</a><a href={YATORI_REPOSITORY_URL} target="_blank" rel="noreferrer" onClick={() => onAccountMenuChange(false)} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.99] lg:hidden" aria-label="查看 GitHub 仓库"><svg className="size-4" aria-hidden="true"><use href="/icons.svg#github-icon" /></svg>GitHub 仓库</a><button type="button" onClick={() => { onAccountMenuChange(false); onLogoutRequest(); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-sm text-destructive transition-colors hover:bg-destructive/10 active:scale-[0.99]"><LogOut className="size-4" />退出登录</button></div>}
    </div></div>
  </header>;
}
