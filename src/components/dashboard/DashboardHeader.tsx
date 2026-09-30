import { lazy, Suspense, useEffect, useState } from 'react';
import { Bell, ChevronDown, LogOut, Search } from 'lucide-react';
import { ThemeToggleButton } from './ThemeToggleButton';
import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import announcementMarkdown from '@/content/announcement.md?raw';
import type { Task } from '@/lib/api';
import type { TaskProgressSnapshot } from '@/hooks/useTaskProgressPolling';
import type { CourseTaskPointProgressMap } from '@/lib/taskProgress';
import {
  QQ_LOGO_URL,
  YATORI_QQ_GROUP_URL,
  YATORI_REPOSITORY_URL,
} from '@/lib/externalLinks';
import type { MobileDashboardTabId } from './dashboardNavigationData';

const AnnouncementMarkdown = lazy(() => import('react-markdown'));

interface DashboardHeaderProps {
  title: string;
  appVersion: string;
  session: {
    displayName: string;
    user: { username: string };
    avatarUrl?: string | null;
  };
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
  onTabChange: (tab: MobileDashboardTabId) => void;
}

export function DashboardHeader({
  title,
  appVersion,
  session,
  accountMenuOpen,
  onAccountMenuChange,
  onLogoutRequest,
  onTabChange,
}: DashboardHeaderProps) {
  const announcementReadKey = `yatori-announcement:${session.user.username}`;
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [readAnnouncementContent, setReadAnnouncementContent] = useState(() => {
    try {
      return localStorage.getItem(announcementReadKey);
    } catch {
      return null;
    }
  });
  const announcementRead = readAnnouncementContent === announcementMarkdown;
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const commandItems: Array<{ id: MobileDashboardTabId; label: string }> = [
    { id: 'courses', label: '章节任务' },
    { id: 'works', label: '作业' },
    { id: 'exams', label: '考试' },
    { id: 'study', label: '学习目标' },
    { id: 'tasks', label: '任务' },
    { id: 'settings', label: '设置' },
  ];
  const filteredCommandItems = commandItems.filter((item) =>
    item.label.includes(commandQuery.trim()),
  );

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const handleAnnouncementOpenChange = (open: boolean) => {
    setAnnouncementOpen(open);
    if (open && !announcementRead) {
      setReadAnnouncementContent(announcementMarkdown);
      try {
        localStorage.setItem(announcementReadKey, announcementMarkdown);
      } catch {
        // Keep the current view usable when browser storage is unavailable.
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 flex min-h-14 items-center justify-between gap-2 border-b border-border bg-background px-3 py-2 sm:min-h-16 sm:px-5 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center lg:hidden">
        <a
          href={YATORI_REPOSITORY_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-w-0 max-w-full items-baseline gap-1.5 rounded-md font-semibold leading-none tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`在 GitHub 查看 Yatori 学习通服务 v${appVersion} 源码`}
        >
          <BrandMark className="shrink-0 text-xl sm:text-2xl" />
          <span className="flex min-w-0 items-baseline gap-1 text-xs">
            <span className="min-w-0 truncate font-semibold text-foreground/80 sm:text-sm">
              学习通服务
            </span>
            <span className="hidden shrink-0 font-medium tabular-nums text-muted-foreground min-[380px]:inline">
              v{appVersion}
            </span>
          </span>
        </a>
      </div>
      <div className="hidden min-w-0 items-center gap-2 lg:flex">
        <span className="text-xs text-muted-foreground">工作区</span>
        <span className="text-muted-foreground">/</span>
        <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
      </div>
      <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="hidden min-w-44 justify-start gap-2 text-muted-foreground lg:flex"
          onClick={() => setCommandOpen(true)}
          aria-label="搜索工作区"
        >
          <Search className="size-4" />
          <span>搜索工作区</span>
          <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
        </Button>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border px-4 py-3">
            <DialogTitle className="sr-only">搜索工作区</DialogTitle>
            <div className="flex items-center gap-2">
              <Search className="size-4 text-muted-foreground" />
              <Input
                autoFocus
                value={commandQuery}
                onChange={(event) => setCommandQuery(event.target.value)}
                placeholder="搜索章节任务、作业、考试..."
                className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto p-2">
            {filteredCommandItems.length > 0 ? filteredCommandItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  onTabChange(item.id);
                  setCommandOpen(false);
                  setCommandQuery('');
                }}
              >
                {item.label}
              </button>
            )) : (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">没有匹配的工作区</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-3">
        <ThemeToggleButton />
        <Dialog
          open={announcementOpen}
          onOpenChange={handleAnnouncementOpenChange}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleAnnouncementOpenChange(true)}
            className="relative h-9 w-9 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="查看公告"
            title="公告"
          >
            <Bell className="size-5" />
            {!announcementRead && (
              <span
                className="absolute right-1 top-1 size-2 rounded-full bg-destructive ring-2 ring-card"
                aria-label="有未读公告"
              />
            )}
          </Button>
          <DialogContent showCloseButton={false} className="gap-5 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>公告</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto text-sm leading-6 text-foreground [&_a]:text-primary [&_a]:underline [&_h1]:mb-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol>li]:list-decimal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:mb-3">
              <Suspense
                fallback={
                  <p className="text-muted-foreground">正在加载公告…</p>
                }
              >
                <AnnouncementMarkdown>
                  {announcementMarkdown}
                </AnnouncementMarkdown>
              </Suspense>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => handleAnnouncementOpenChange(false)}
              >
                我知道了
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="relative">
          <button
            type="button"
            onClick={() => onAccountMenuChange(!accountMenuOpen)}
            className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-left transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-3 sm:px-3"
            aria-expanded={accountMenuOpen}
            aria-label={`当前用户 ${session.displayName}`}
          >
            {session.avatarUrl ? (
              <img
                src={session.avatarUrl}
                alt="头像"
                className="h-6 w-6 rounded-full object-cover ring-1 ring-border sm:h-7 sm:w-7"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground sm:h-7 sm:w-7 sm:text-xs">
                {session.displayName.substring(0, 1).toUpperCase()}
              </div>
            )}
            <div className="hidden min-w-0 flex-col text-left min-[360px]:flex">
              <span className="max-w-[68px] truncate text-[11px] font-bold min-[400px]:max-w-none sm:max-w-[100px] sm:text-xs sm:font-semibold">
                {session.displayName}
              </span>
              <span className="hidden max-w-[100px] truncate text-xs text-muted-foreground sm:block">
                {session.user.username}
              </span>
            </div>
            <ChevronDown
              className={`size-4 text-muted-foreground transition-transform duration-200 ease-standard ${accountMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {accountMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 max-w-[calc(100vw-1rem)] rounded-md border border-border bg-popover p-1.5 text-popover-foreground shadow-floating animate-in fade-in-0 zoom-in-95 duration-150 motion-reduce:animate-none">
              <div className="border-b border-border px-3 pb-2 pt-1">
                <p className="truncate text-sm font-semibold">
                  {session.displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {session.user.username}
                </p>
              </div>
              <a
                href={YATORI_QQ_GROUP_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => onAccountMenuChange(false)}
                className="mt-1 flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
                aria-label="加入QQ群组"
              >
                <img
                  src={QQ_LOGO_URL}
                  alt=""
                  className="size-4 object-contain"
                />
                QQ群组
              </a>
              <a
                href={YATORI_REPOSITORY_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => onAccountMenuChange(false)}
                className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
                aria-label="查看 GitHub 仓库"
              >
                <svg className="size-4" aria-hidden="true">
                  <use href="/icons.svg#github-icon" />
                </svg>
                GitHub 仓库
              </a>
              <button
                type="button"
                onClick={() => {
                  onAccountMenuChange(false);
                  onLogoutRequest();
                }}
                className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
