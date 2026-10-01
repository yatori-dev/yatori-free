import { lazy, Suspense, useState } from 'react';
import { Bell, ChevronDown, LogOut } from 'lucide-react';
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
      } catch {
        // Keep the current view usable when browser storage is unavailable.
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-3 py-2 sm:px-5 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center lg:hidden">
        <a
          href={YATORI_REPOSITORY_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-w-0 max-w-full items-baseline gap-1.5 rounded-md font-semibold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            className="flex h-9 min-w-0 items-center gap-2 rounded-md px-1.5 text-left transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-2.5 sm:px-2"
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
              <span className="max-w-[68px] truncate text-xs font-medium sm:max-w-[100px] sm:text-sm">
                {session.displayName}
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
