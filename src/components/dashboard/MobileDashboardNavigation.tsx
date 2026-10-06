import { mobileItems, type MobileDashboardTabId } from './dashboardNavigationData';
import { MotionHighlight } from '@/components/ui/motion-highlight';

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

  return (
    <nav
      className="motion-highlight-host absolute inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto grid h-14 w-[calc(100%-3rem)] max-w-sm grid-cols-3 items-center rounded-full border border-border bg-card p-1 shadow-floating lg:hidden"
      aria-label="移动主导航"
    >
      <MotionHighlight selector='[aria-current="page"]' />
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const active = item.id === 'courses' ? isLearningActive : activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id === 'courses' && isLearningActive ? activeTab : item.id)}
            className={`flex h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-full text-xs transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground hover:text-foreground'}`}
            aria-current={active ? 'page' : undefined}
            aria-label={item.id === 'tasks' && activeTaskCount > 0 ? `任务，${activeTaskCount} 项进行中` : item.label}
          >
            <span className={`relative flex h-7 w-10 items-center justify-center rounded-full ${active ? 'bg-primary-container' : ''}`}>
              <Icon className="size-[18px]" aria-hidden="true" />
              {item.id === 'tasks' && activeTaskCount > 0 && (
                <span className="absolute -right-2 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] tabular-nums text-primary-foreground ring-2 ring-card" aria-hidden="true">
                  {activeTaskCount > 99 ? '99+' : activeTaskCount}
                </span>
              )}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
