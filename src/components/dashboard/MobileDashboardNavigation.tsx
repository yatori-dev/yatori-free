import { mobileItems, type MobileDashboardTabId } from './dashboardNavigationData';

interface MobileDashboardNavigationProps {
  activeTab: MobileDashboardTabId;
  activeTaskCount: number;
  onTabChange: (tab: MobileDashboardTabId) => void;
}

export function MobileDashboardNavigation({
  activeTab,
  activeTaskCount,
  onTabChange,
}: MobileDashboardNavigationProps) {
  const isLearningActive =
    activeTab === 'courses' || activeTab === 'works' || activeTab === 'exams';
  const activeMobileIndex = isLearningActive
    ? 0
    : mobileItems.findIndex((item) => item.id === activeTab);

  return (
    <nav
      className="dashboard-mobile-navigation absolute inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto flex w-[calc(100%-3rem)] max-w-sm items-center rounded-full border border-border/80 bg-card/95 p-1 shadow-floating backdrop-blur-md lg:hidden"
      aria-label="移动主导航"
    >
      <span
        className="pointer-events-none absolute inset-x-1 inset-y-1"
        aria-hidden="true"
      >
        <span
          className="absolute inset-y-0 left-0 w-1/3"
          style={{
            transform: `translate3d(${Math.max(activeMobileIndex, 0) * 100}%, 0, 0)`,
            transition: 'transform var(--duration-fast) var(--ease-smooth-out)',
          }}
        >
          <span
            key={activeMobileIndex}
            className="absolute left-1/2 top-px h-7 w-10 -translate-x-1/2 rounded-full bg-primary-container/70 animate-in fade-in-0 duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] motion-reduce:animate-none"
          />
        </span>
      </span>
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const active = item.id === 'courses' ? isLearningActive : activeTab === item.id;
        const showTaskBadge = item.id === 'tasks' && activeTaskCount > 0;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (item.id === 'courses') {
                onTabChange(isLearningActive ? activeTab : 'courses');
              } else {
                onTabChange(item.id);
              }
            }}
            className={`relative z-10 flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-full transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            aria-current={active ? 'page' : undefined}
            aria-label={item.id === 'tasks' && activeTaskCount > 0 ? `任务，${activeTaskCount} 项进行中` : item.label}
          >
            <span className="relative flex h-7 w-10 items-center justify-center rounded-full">
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {showTaskBadge && (
                <span className="absolute -right-1 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-xs font-bold text-primary-foreground ring-2 ring-card animate-in zoom-in-95 duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] motion-reduce:animate-none" aria-hidden="true">
                  {activeTaskCount > 99 ? '99+' : activeTaskCount}
                </span>
              )}
            </span>
            <span className={`text-xs leading-none ${active ? 'font-semibold' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
