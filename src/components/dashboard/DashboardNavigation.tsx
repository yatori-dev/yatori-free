import { useLayoutEffect, useRef } from 'react';

import { BrandMark } from '@/components/BrandMark';
import { YATORI_REPOSITORY_URL } from '@/lib/externalLinks';
import { desktopItems, mobileItems } from './dashboardNavigationData';
import type { MobileDashboardTabId } from './dashboardNavigationData';

interface DashboardNavigationProps {
  mode: 'desktop' | 'mobile';
  activeTab: MobileDashboardTabId;
  activeTaskCount: number;
  appVersion?: string;
  signMonitorActive: boolean;
  onTabChange: (tab: MobileDashboardTabId) => void;
}

export type { DashboardViewId, MobileDashboardTabId } from './dashboardNavigationData';

function Brand({ appVersion }: { appVersion?: string }) {
  return (
    <div className="flex h-16 items-center justify-start border-b border-border/70 px-5">
      <a
        href={YATORI_REPOSITORY_URL}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="在 GitHub 查看 Yatori 学习通服务源码"
      >
        <BrandMark className="text-xl" />
        <span className="min-w-0">
          <span className="block truncate text-xs font-medium text-muted-foreground">学习通服务</span>
          <span className="block text-[11px] tabular-nums text-muted-foreground">v{appVersion ?? '...'}</span>
        </span>
      </a>
    </div>
  );
}

export function DashboardNavigation({ mode, activeTab, activeTaskCount, appVersion, signMonitorActive, onTabChange }: DashboardNavigationProps) {
  const mobileIndicatorRef = useRef<HTMLSpanElement>(null);
  const mobileIndicatorAnimationRef = useRef<Animation | null>(null);
  const previousMobileTabRef = useRef(activeTab);
  const activeMobileIndex = mobileItems.findIndex((item) => item.id === activeTab);

  useLayoutEffect(() => {
    const previousTab = previousMobileTabRef.current;
    previousMobileTabRef.current = activeTab;

    if (mode !== 'mobile') {
      return;
    }

    const indicator = mobileIndicatorRef.current;
    const previousIndex = mobileItems.findIndex((item) => item.id === previousTab);
    if (!indicator || previousIndex < 0 || activeMobileIndex < 0 || previousIndex === activeMobileIndex) {
      return;
    }

    mobileIndicatorAnimationRef.current?.cancel();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof indicator.animate !== 'function') {
      return;
    }

    const source = `translate3d(${previousIndex * 100}%, 0, 0)`;
    const target = `translate3d(${activeMobileIndex * 100}%, 0, 0)`;
    const animation = indicator.animate(
      [
        { offset: 0, transform: source, easing: 'cubic-bezier(0.4, 0, 1, 1)' },
        { offset: 0.22, transform: `${source} scale3d(0.12, 0.82, 1)`, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
        { offset: 0.46, transform: `${target} scale3d(0.12, 0.82, 1)`, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        { offset: 0.78, transform: `${target} scale3d(1.12, 1.04, 1)`, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        { offset: 1, transform: target },
      ],
      { duration: 420, fill: 'both' },
    );
    mobileIndicatorAnimationRef.current = animation;

    return () => {
      animation.cancel();
      if (mobileIndicatorAnimationRef.current === animation) {
        mobileIndicatorAnimationRef.current = null;
      }
    };
  }, [activeMobileIndex, activeTab, mode]);

  if (mode === 'desktop') {
    return (
      <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card lg:flex" aria-label="应用侧边栏">
        <Brand appVersion={appVersion} />
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="主导航">
          {desktopItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative flex min-h-11 w-full items-center justify-start gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
              >
                <span className={`absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0'}`} />
                <span className="relative">
                  <Icon className="h-4 w-4 shrink-0" />
                </span>
                <span>{item.label}</span>
                {item.id === 'sign' && signMonitorActive && <span className="ml-auto h-2 w-2 rounded-full bg-primary" aria-label="签到已启用" />}
              </button>
            );
          })}
        </nav>
        <div className="px-3 pb-4">
          <a
            href={YATORI_REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="在 GitHub 查看 Yatori 学习通服务源码"
          >
            <svg className="h-4 w-4 shrink-0" aria-hidden="true">
              <use href="/icons.svg#github-icon" />
            </svg>
            <span>GitHub</span>
          </a>
        </div>
      </aside>
    );
  }

  return (
    <nav
      className="absolute inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto flex w-[calc(100%-3rem)] max-w-sm items-center rounded-full border border-border/80 bg-card/95 p-1 shadow-floating backdrop-blur-md lg:hidden"
      aria-label="移动主导航"
    >
      <span className="pointer-events-none absolute inset-x-1 inset-y-1" aria-hidden="true">
        <span
          ref={mobileIndicatorRef}
          className="absolute inset-y-0 left-0 w-1/4 will-change-transform"
          style={{ transform: `translate3d(${Math.max(activeMobileIndex, 0) * 100}%, 0, 0)` }}
        >
          <span className="absolute left-1/2 top-px h-7 w-10 -translate-x-1/2 rounded-full bg-primary-container/70" />
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
            className={`relative z-10 flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className={`relative flex h-7 w-10 items-center justify-center rounded-full transition-transform duration-200 ease-out ${active ? 'scale-110' : 'scale-100'}`}>
              <Icon className="h-[18px] w-[18px]" />
              {showTaskBadge && (
                <span className="absolute -right-1 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-xs font-bold text-primary-foreground ring-2 ring-card animate-in zoom-in-75 duration-200">
                  {activeTaskCount}
                </span>
              )}
              {showSignBadge && <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" aria-label="签到已启用" />}
            </span>
            <span className={`text-xs leading-none ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
