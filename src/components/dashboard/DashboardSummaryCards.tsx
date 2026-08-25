import { BookOpen, CircleDotDashed, ListChecks, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardSummaryCardsProps {
  courseCount: number;
  pendingCourseCount: number;
  activeTaskCount: number;
  selectedCourseCount: number;
}

export function DashboardSummaryCards({
  courseCount,
  pendingCourseCount,
  activeTaskCount,
  selectedCourseCount,
}: DashboardSummaryCardsProps) {
  const items = [
    { label: '课程总数', value: courseCount, icon: BookOpen },
    { label: '待处理课程', value: pendingCourseCount, icon: CircleDotDashed },
    { label: '进行中任务', value: activeTaskCount, icon: PlayCircle },
    { label: '已选课程', value: selectedCourseCount, icon: ListChecks },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 px-3 pt-3 sm:gap-4 sm:px-0 sm:pt-0 xl:grid-cols-4">
      {items.map(({ label, value, icon: Icon }) => (
        <Card key={label} size="sm" className="shadow-xs">
          <CardHeader className="grid grid-cols-[1fr_auto] items-center gap-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</CardTitle>
            <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums sm:text-3xl">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
