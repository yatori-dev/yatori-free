import './task-chart-loading.css';

export function TaskChartsSkeleton() {
  return (
    <div role="status" aria-label="正在加载任务图表" className="task-chart-loading border-b border-border">
      <div className="t-skel-skeleton is-pulsing flex min-w-0 flex-col xl:flex-row" aria-hidden="true">
        <div className="min-w-0 flex-1 py-6 xl:pr-8">
          <div className="mb-5 flex h-10 items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-28 max-w-full rounded-[var(--radius-sm)] bg-muted" />
              <div className="h-3 w-44 max-w-full rounded-[var(--radius-sm)] bg-muted" />
            </div>
            <div className="h-9 w-28 shrink-0 rounded-[var(--radius-md)] bg-muted" />
          </div>
          <div className="h-52 w-full rounded-[var(--radius-md)] bg-muted sm:h-60" />
        </div>
        <div className="min-w-0 border-t border-border py-6 xl:w-72 xl:shrink-0 xl:border-t-0 xl:border-l xl:pl-8">
          <div className="h-5 w-20 rounded-[var(--radius-sm)] bg-muted" />
          <div className="mt-3 flex flex-wrap items-center gap-4 xl:flex-col xl:gap-2">
            <div className="h-36 w-36 shrink-0 rounded-full border-[16px] border-muted xl:h-40 xl:w-40" />
            <div className="min-w-0 flex-1 space-y-1 xl:w-full">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex h-9 items-center justify-between gap-4 px-2">
                  <div className="h-3 w-16 rounded-[var(--radius-sm)] bg-muted" />
                  <div className="h-3 w-5 rounded-[var(--radius-sm)] bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
