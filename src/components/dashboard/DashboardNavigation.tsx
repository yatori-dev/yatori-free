import { useEffect, useState } from 'react';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Menu,
  Settings,
  X,
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
      aria-current={active ? 'page' : undefined}
      className={`group flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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

function Brand({ appVersion, collapsed }: { appVersion?: string; collapsed: boolean }) {
  return (
    <div className={`flex h-16 shrink-0 items-center border-b border-border ${collapsed ? 'justify-center px-2' : 'px-4'}`}>
      <a
        href={YATORI_REPOSITORY_URL}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="在 GitHub 查看 Yatori 学习通服务源码"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">Y</span>
        {!collapsed && (
          <span className="grid min-w-0 text-left leading-tight">
            <BrandMark className="truncate text-base" />
            <span className="truncate text-[11px] text-muted-foreground">
              学习通服务{appVersion ? ` · v${appVersion}` : ''}
            </span>
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
      className={`hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex ${collapsed ? 'w-16' : 'w-64'}`}
      aria-label="应用侧边栏"
    >
      <Brand appVersion={appVersion} collapsed={collapsed} />
      <div className={`flex items-center py-3 ${collapsed ? 'justify-center' : 'justify-end px-3'}`}>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={collapsed ? '展开侧栏' : '折叠侧栏'}
          title={collapsed ? '展开侧栏' : '折叠侧栏'}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3" aria-label="主导航">
        <p className={`mb-1 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground ${collapsed ? 'sr-only' : ''}`}>工作区</p>
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

function MobileNavigation({
  activeTab,
  activeTaskCount,
  onTabChange,
}: Omit<DashboardNavigationProps, 'mode' | 'appVersion'>) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground shadow-floating transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        aria-label="打开导航菜单"
      >
        <Menu className="size-4" />
        菜单
        {activeTaskCount > 0 && (
          <span className="flex min-w-5 items-center justify-center rounded-md bg-primary px-1.5 py-0.5 text-[11px] leading-none text-primary-foreground">
            {activeTaskCount > 99 ? '99+' : activeTaskCount}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={close} aria-label="关闭导航菜单" />
          <aside className="relative flex h-full w-[min(19rem,88vw)] flex-col border-r border-border bg-card text-foreground shadow-overlay" aria-label="移动导航">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">Y</span>
                <BrandMark className="text-base" />
              </div>
              <button type="button" onClick={close} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="关闭导航菜单">
                <X className="size-4" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="移动主导航">
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">工作区</p>
              {desktopItems.slice(0, 4).map((item) => (
                <NavigationItem
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  collapsed={false}
                  active={activeTab === item.id}
                  onClick={() => { onTabChange(item.id); close(); }}
                />
              ))}
              <NavigationItem
                label="任务"
                icon={Activity}
                collapsed={false}
                active={activeTab === 'tasks'}
                count={activeTaskCount}
                onClick={() => { onTabChange('tasks'); close(); }}
              />
              <div className="my-3 border-t border-border" />
              <NavigationItem
                label="设置"
                icon={Settings}
                collapsed={false}
                active={activeTab === 'settings'}
                onClick={() => { onTabChange('settings'); close(); }}
              />
            </nav>
            <div className="border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <a href={YATORI_QQ_GROUP_URL} target="_blank" rel="noreferrer" className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" onClick={close}>
                <img src={QQ_LOGO_URL} alt="" className="size-4 object-contain" />
                QQ群组
              </a>
              <a href={YATORI_REPOSITORY_URL} target="_blank" rel="noreferrer" className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" onClick={close}>
                <svg className="size-4" aria-hidden="true"><use href="/icons.svg#github-icon" /></svg>
                GitHub
              </a>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export function DashboardNavigation(props: DashboardNavigationProps) {
  return props.mode === 'desktop' ? <DesktopNavigation {...props} /> : <MobileNavigation {...props} />;
}
