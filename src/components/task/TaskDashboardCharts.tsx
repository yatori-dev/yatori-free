import { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, matchByDataKey,
} from 'recharts';
import type { Task } from '@/lib/api';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  getTaskCreationHistory, getTaskDistribution, type TaskGroup,
} from '@/lib/taskDashboard';

interface TaskDashboardChartsProps {
  tasks: Task[];
  onSelectGroup: (group: TaskGroup) => void;
}

const tooltipStyle = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--popover-foreground)',
  fontSize: 12,
};

const matchHistoryDate = matchByDataKey('date');

export default function TaskDashboardCharts({ tasks, onSelectGroup }: TaskDashboardChartsProps) {
  const [days, setDays] = useState(7);
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [pieAnimated, setPieAnimated] = useState(false);
  const [animationDuration] = useState(() => {
    const duration = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--motion-panel'));
    return Number.isFinite(duration) ? duration : 400;
  });
  const { history, missingDates } = useMemo(() => getTaskCreationHistory(tasks, days), [tasks, days]);
  const distribution = useMemo(() => getTaskDistribution(tasks), [tasks]);
  const pieData = useMemo(() => distribution.filter((group) => group.count > 0), [distribution]);
  const totalCreated = history.reduce((sum, day) => sum + day.count, 0);

  const handleDaysChange = (value: string) => {
    const nextDays = Number(value);
    if (nextDays === days) return;
    setBarsAnimated(false);
    setDays(nextDays);
  };

  return (
    <div className="flex min-w-0 flex-col border-b border-border xl:flex-row">
      <section className="min-w-0 flex-1 py-6 xl:pr-8" aria-label="任务创建记录">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">任务创建记录</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              近 {days} 天创建 {totalCreated} 项
            </p>
          </div>
          <Select value={String(days)} onValueChange={handleDaysChange}>
            <SelectTrigger className="h-9 w-28" aria-label="统计时间范围">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">近 7 天</SelectItem>
              <SelectItem value="14">近 14 天</SelectItem>
              <SelectItem value="30">近 30 天</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="h-52 min-w-0 w-full sm:h-60" role="group" aria-label={`近 ${days} 天创建 ${totalCreated} 项任务`}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart accessibilityLayer data={history} margin={{ top: 12, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={18} tickMargin={10} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={tooltipStyle} itemStyle={{ color: 'var(--foreground)' }} formatter={(value) => [`${value} 项`, '创建任务']} />
              <Bar dataKey="count" name="创建任务" fill="var(--primary)" radius={[3, 3, 0, 0]} maxBarSize={36} isAnimationActive={barsAnimated ? false : 'auto'} animationMatchBy={matchHistoryDate} animationBegin={0} animationDuration={animationDuration} animationEasing="ease-out" onAnimationEnd={() => setBarsAnimated(true)} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {missingDates > 0 && <p className="mt-2 text-xs text-muted-foreground">{missingDates} 项缺少创建时间，未计入图表</p>}
      </section>
      <section className="min-w-0 border-t border-border py-6 xl:w-72 xl:shrink-0 xl:border-t-0 xl:border-l xl:pl-8" aria-label="任务状态分布">
        <h3 className="text-sm font-semibold">状态分布</h3>
        <div className="mt-3 flex flex-wrap items-center gap-4 xl:flex-col xl:gap-2">
          <div className="relative h-36 w-36 shrink-0 xl:h-40 xl:w-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart accessibilityLayer>
                <Pie data={pieData} dataKey="count" nameKey="label" innerRadius="72%" outerRadius="95%" paddingAngle={2} stroke="var(--background)" strokeWidth={3} isAnimationActive={pieAnimated ? false : 'auto'} animationBegin={0} animationDuration={animationDuration} animationEasing="ease-out" onAnimationEnd={() => setPieAnimated(true)} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--foreground)' }} formatter={(value) => [`${value} 项`, '任务']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold tabular-nums">{tasks.length}</span>
              <span className="mt-1 text-xs text-muted-foreground">任务总数</span>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1 xl:w-full">
            {distribution.map((group) => (
              <button key={group.key} type="button" onClick={() => onSelectGroup(group.key)} title={group.key === 'attention' ? '失败或部分完成' : `查看${group.label}`} className="flex min-h-9 w-full items-center gap-2 rounded-[var(--radius-md)] px-2 text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`查看${group.label}任务，${group.count} 项`}>
                <span className="h-2.5 w-2.5 shrink-0 rounded-[var(--radius-sm)]" style={{ backgroundColor: group.color }} aria-hidden="true" />
                <span className="min-w-0 flex-1 text-left">{group.label}</span>
                <span className="font-medium tabular-nums">{group.count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
