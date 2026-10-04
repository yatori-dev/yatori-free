import { lazy, Suspense, useState } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { ThemeToggleButton } from './ThemeToggleButton';
import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import announcementMarkdown from '@/content/announcement.md?raw';
import type { Task } from '@/lib/api';
import type { TaskProgressSnapshot } from '@/hooks/useTaskProgressPolling';
import type { CourseTaskPointProgressMap } from '@/lib/taskProgress';
import {
  QQ_LOGO_URL,
  YATORI_QQ_GROUP_URL,
  YATORI_REPOSITORY_URL,
} from '@/lib/externalLinks';

const AnnouncementMarkdown = lazy(() => import('react-markdown'));

interface DashboardHeaderProps {
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
}

export function DashboardHeader({
  appVersion,
  session,
  accountMenuOpen,
  onAccountMenuChange,
  onLogoutRequest,
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

  const handleAnnouncementOpenChange = (open: boolean) => {
    setAnnouncementOpen(open);
    if (open && !announcementRead) {
      setReadAnnouncementContent(announcementMarkdown);
      try {
        localStorage.setItem(announcementReadKey, announcementMarkdown);
      } catch {}}
    }
  };

  return (
    <header className="sticky top-0 z-40 flex min-h-14 shrink-0 items-center justify-between gap-[var(--space-3)] border-b border-border bg-background px-[var(--space-3)] py-2 sm:px-[var(--space-5)] lg:px-[var(--space-6)]">
      <div className="flex min-w-0 flex-1 items-center lg:hidden">
        <a
          href={YATORI_REPOSITORY_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-w-0 max-w-full items-baseline gap-1.5 rounded-[var(--radius-md)] font-semibold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-[var(--space-3)]">
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
            className="relative h-9 w-9 rounded-[var(--radius-md)] text-muted-foreground hover:bg-muted hover:text-foreground"
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
          <DialogContent showCloseButton={false} className="gap-[var(--space-5)] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>公告</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto text-sm leading-6 text-foreground [&_a]:text-primary [&_a]:underline [&_h1]:mb-[var(--space-3)] [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-[var(--space-4)] [&_h2]:text-base [&_h2]:font-semibold [&_li]:ml-[var(--space-5)] [&_li]:list-disc [&_ol>li]:list-decimal [&_p]:mb-[var(--space-3)] [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:mb-[var(--space-3)]">
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
        <DropdownMenu open={accountMenuOpen} onOpenChange={onAccountMenuChange} modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 gap-2 px-1.5 sm:gap-2.5 sm:px-2"
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
                <span className="max-w-[68px] truncate text-xs font-medium sm:max-w-[100px] sm:text-sm">
                  {session.displayName}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="truncate text-sm font-semibold">
                  {session.displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {session.user.username}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="lg:hidden">
              <a
                href={YATORI_QQ_GROUP_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2"
              >
                <img
                  src={QQ_LOGO_URL}
                  alt=""
                  className="size-4 object-contain"
                />
                QQ群组
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="lg:hidden">
              <a
                href={YATORI_REPOSITORY_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2"
              >
                <svg className="size-4" aria-hidden="true">
                  <use href="/icons.svg#github-icon" />
                </svg>
                GitHub 仓库
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="lg:hidden" />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                onAccountMenuChange(false);
                onLogoutRequest();
              }}
              className="flex items-center gap-2"
            >
              <LogOut className="size-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
