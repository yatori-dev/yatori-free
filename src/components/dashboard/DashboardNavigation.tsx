import { useState } from 'react';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import {
  QQ_LOGO_URL,
  YATORI_QQ_GROUP_URL,
  YATORI_REPOSITORY_URL,
} from '@/lib/externalLinks';
import { desktopItems } from './dashboardNavigationData';
import type { MobileDashboardTabId } from './dashboardNavigationData';
import { MobileDashboardNavigation } from './MobileDashboardNavigation';

interface DashboardNavigationProps {
  mode: 'desktop' | 'mobile';
  activeTab: MobileDashboardTabId;
  activeTaskCount: number;
  appVersion?: string;
  onTabChange: (tab: MobileDashboardTabId) => void;
}

export type {
  DashboardViewId,
  MobileDashboardTabId,
} from './dashboardNavigationData';

function NavigationItem({
  label,
  active,
  collapsed,
  onClick,
  icon: Icon,
  count,
}: {
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  icon: LucideIcon;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`group flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground'
      } ${collapsed ? 'justify-center px-0' : ''}`}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="min-w-0 flex-1 truncate text-left">{label}</span>}
      {!collapsed && count !== undefined && count > 0 && (
        <span className="flex min-w-5 items-center justify-center rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary-foreground">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

function Brand({
  appVersion,
  collapsed,
}: {
  appVersion?: string;
  collapsed: boolean;
}) {
  return (
    <div className={`flex h-14 shrink-0 items-center ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
      <a
        href={YATORI_REPOSITORY_URL}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="在 GitHub 查看 Yatori 学习通服务源码"
      >
        {collapsed ? (
          <BrandMark compact className="text-2xl" />
        ) : (
          <BrandMark className="shrink-0 text-2xl" />
        )}
        {!collapsed && (
          <span className="grid min-w-0 text-left leading-tight">
            <span className="truncate text-[11px] text-muted-foreground">
              学习通服务
            </span>
            {appVersion && <span className="text-[11px] tabular-nums text-muted-foreground">v{appVersion}</span>}
          </span>
        )}
      </a>
    </div>
  );
}

function DesktopNavigation({
  activeTab,
  activeTaskCount,
  appVersion,
  onTabChange,
}: Omit<DashboardNavigationProps, 'mode'>) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 motion-reduce:transition-none lg:flex ${collapsed ? 'w-16' : 'w-64'}`}
      aria-label="应用侧边栏"
    >
      <Brand
        appVersion={appVersion}
        collapsed={collapsed}
      />
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="absolute -right-3 top-4 z-50 flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={collapsed ? '展开侧栏' : '折叠侧栏'}
        title={collapsed ? '展开侧栏' : '折叠侧栏'}
      >
        {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
      </button>
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3" aria-label="主导航">
        {desktopItems.slice(0, 4).map((item) => (
          <NavigationItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            collapsed={collapsed}
            active={activeTab === item.id}
            onClick={() => onTabChange(item.id)}
          />
        ))}
        <NavigationItem
          label="任务"
          icon={Activity}
          collapsed={collapsed}
          active={activeTab === 'tasks'}
          count={activeTaskCount}
          onClick={() => onTabChange('tasks')}
        />
        <div className="my-3 border-t border-border" />
        <NavigationItem
          label="设置"
          icon={desktopItems[4].icon}
          collapsed={collapsed}
          active={activeTab === 'settings'}
          onClick={() => onTabChange('settings')}
        />
      </nav>
      <div className={`flex flex-col gap-1 border-t border-border px-3 py-3 ${collapsed ? 'items-center' : ''}`}>
        <a
          href={YATORI_QQ_GROUP_URL}
          target="_blank"
          rel="noreferrer"
          className={`flex min-h-9 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${collapsed ? 'justify-center px-0' : ''}`}
          aria-label="加入QQ群组"
          title={collapsed ? 'QQ群组' : undefined}
        >
          <img src={QQ_LOGO_URL} alt="" className="size-4 object-contain" />
          {!collapsed && <span>QQ群组</span>}
        </a>
        <a
          href={YATORI_REPOSITORY_URL}
          target="_blank"
          rel="noreferrer"
          className={`flex min-h-9 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${collapsed ? 'justify-center px-0' : ''}`}
          aria-label="在 GitHub 查看 Yatori 学习通服务源码"
          title={collapsed ? 'GitHub' : undefined}
        >
          <svg className="size-4 shrink-0" aria-hidden="true"><use href="/icons.svg#github-icon" /></svg>
          {!collapsed && <span>GitHub</span>}
        </a>
      </div>
    </aside>
  );
}

export function DashboardNavigation(props: DashboardNavigationProps) {
  return props.mode === 'desktop' ? <DesktopNavigation {...props} /> : <MobileDashboardNavigation {...props} />;
}
