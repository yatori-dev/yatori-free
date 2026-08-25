import type { ReactNode } from 'react';
import type { AuthSession } from '@/lib/api';
import { BrandMark } from '@/components/BrandMark';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { desktopItems, mobileItems } from './dashboardNavigationData';
import type { MobileDashboardTabId } from './dashboardNavigationData';
import { ChevronsUpDown, LibraryBig, LogOut } from 'lucide-react';
import { YATORI_REPOSITORY_URL } from '@/lib/externalLinks';

interface DashboardNavigationProps {
  mode: 'desktop' | 'mobile';
  activeTab: MobileDashboardTabId;
  activeTaskCount: number;
  appVersion?: string;
  signMonitorActive: boolean;
  session?: AuthSession;
  footerActions?: ReactNode;
  onOpenSource?: () => void;
  onLogout?: () => void;
  onTabChange: (tab: MobileDashboardTabId) => void;
}

export type { DashboardViewId, MobileDashboardTabId } from './dashboardNavigationData';

interface DashboardAccountMenuProps {
  session: AuthSession;
  compact?: boolean;
  onOpenSource: () => void;
  onLogout: () => void;
}

export function DashboardAccountMenu({
  session,
  compact = false,
  onOpenSource,
  onLogout,
}: DashboardAccountMenuProps) {
  const avatar = (
    <Avatar className="size-8">
      {session.avatarUrl && <AvatarImage src={session.avatarUrl} alt={session.displayName} referrerPolicy="no-referrer" />}
      <AvatarFallback>{session.displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button size="icon" variant="ghost" className="size-9 rounded-md" aria-label="打开账户菜单">
            {avatar}
          </Button>
        ) : (
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            {avatar}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{session.displayName}</span>
              <span className="block truncate text-xs text-muted-foreground">{session.user.username}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side={compact ? 'bottom' : 'right'}
        sideOffset={8}
        className="w-60"
      >
        <DropdownMenuLabel className="px-2 py-1.5 font-normal">
          <span className="block truncate text-sm font-medium text-foreground">{session.displayName}</span>
          <span className="block truncate text-xs text-muted-foreground">{session.user.username}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="px-2 py-1.5">
            <a href={YATORI_REPOSITORY_URL} target="_blank" rel="noreferrer">
              <svg className="size-4" aria-hidden="true"><use href="/icons.svg#github-icon" /></svg>
              GitHub
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem className="px-2 py-1.5" onSelect={onOpenSource}>
            <LibraryBig />
            开源说明
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="px-2 py-1.5" onSelect={onLogout}>
          <LogOut />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardNavigation({
  mode,
  activeTab,
  activeTaskCount,
  appVersion,
  signMonitorActive,
  session,
  footerActions,
  onOpenSource,
  onLogout,
  onTabChange,
}: DashboardNavigationProps) {
  const activeMobileIndex = mobileItems.findIndex((item) => item.id === activeTab);

  if (mode === 'desktop') {
    return (
      <Sidebar collapsible="none" className="hidden border-r border-sidebar-border lg:flex" aria-label="应用侧边栏">
        <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2">
            <BrandMark className="text-xl" />
            <span className="text-xs text-muted-foreground">学习通服务 · v{appVersion ?? '...'}</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>工作台</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {desktopItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        type="button"
                        isActive={active}
                        onClick={() => onTabChange(item.id)}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {item.id === 'tasks' && activeTaskCount > 0 && <SidebarMenuBadge>{activeTaskCount}</SidebarMenuBadge>}
                      {item.id === 'sign' && signMonitorActive && (
                        <SidebarMenuBadge aria-label="签到监测已启用"><span className="size-2 rounded-full bg-success" /></SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="flex min-w-0 items-center gap-1">
            {session && onOpenSource && onLogout && (
              <DashboardAccountMenu session={session} onOpenSource={onOpenSource} onLogout={onLogout} />
            )}
            {footerActions}
          </div>
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <nav
      className="absolute inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-sm items-center rounded-xl border bg-background/95 p-1 shadow-floating backdrop-blur-md lg:hidden"
      aria-label="移动主导航"
    >
      <span className="pointer-events-none absolute inset-x-1 inset-y-1" aria-hidden="true">
        <span className="absolute inset-y-0 left-0 w-1/4 transition-transform duration-200" style={{ transform: `translateX(${Math.max(activeMobileIndex, 0) * 100}%)` }}>
          <span className="absolute inset-0 rounded-lg bg-accent" />
        </span>
      </span>
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.id;
        const showTaskBadge = item.id === 'tasks' && activeTaskCount > 0;
        const showSignBadge = item.id === 'sign' && signMonitorActive;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={`relative z-10 flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? 'text-foreground' : 'text-muted-foreground'}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="relative flex h-6 items-center justify-center">
              <Icon className="size-[18px]" />
              {showTaskBadge && <span className="absolute -right-3 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">{activeTaskCount}</span>}
              {showSignBadge && <span className="absolute -right-2 top-0 size-2 rounded-full bg-success" aria-label="签到监测已启用" />}
            </span>
            <span className="text-xs leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
