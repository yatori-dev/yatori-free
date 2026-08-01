import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  History,
  Layers3,
  RefreshCw,
  Users,
} from 'lucide-react';
import type { SignHistoryError, SignLog } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getSignLogTimestamp,
  getSignLogTimeValue,
  getSignResultClassName,
  getSignTypeBadge,
} from './sign-log-presentation';

type SignLogView = 'time' | 'course';
type SignLogOrder = 'newest' | 'oldest';

interface SignLogHistoryProps {
  errors: SignHistoryError[];
  limit: number;
  loading: boolean;
  logs: SignLog[];
  offset: number;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onRefresh: () => void;
  total: number;
}

function formatLogDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function SignLogRow({ log, showCourse = true }: { log: SignLog; showCourse?: boolean }) {
  const signType = getSignTypeBadge(log);
  const hasAttendanceCount = typeof log.signedCount === 'number'
    && typeof log.totalCount === 'number';

  return (
    <div className="flex flex-col gap-2 p-4 transition-colors duration-200 hover:bg-muted/30 sm:gap-1.5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        {showCourse ? (
          <span className="truncate text-xs font-semibold text-foreground sm:text-sm">
            {log.courseName ?? '课程未记录'}
          </span>
        ) : (
          <span className="truncate text-xs text-muted-foreground sm:text-sm">
            {log.signName ?? signType.label}
          </span>
        )}
        <Badge
          variant="outline"
          className={`shrink-0 font-semibold ${getSignResultClassName(log.result)}`}
        >
          {log.result}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="truncate font-mono tabular-nums">
          {formatLogDateTime(getSignLogTimestamp(log))}
        </span>
        {hasAttendanceCount && (
          <span className="inline-flex items-center gap-1 font-medium tabular-nums text-foreground/75">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            已签到 {log.signedCount} / {log.totalCount} 人
          </span>
        )}
      </div>

      <Badge variant="outline" className={signType.className}>
        {log.signName ?? signType.label}
      </Badge>
    </div>
  );
}

export function SignLogHistory({
  errors,
  limit,
  loading,
  logs,
  offset,
  onNextPage,
  onPreviousPage,
  onRefresh,
  total,
}: SignLogHistoryProps) {
  const [view, setView] = useState<SignLogView>('time');
  const [order, setOrder] = useState<SignLogOrder>('newest');
  const sortedLogs = useMemo(() => (
    [...logs].sort((left, right) => {
      const difference = getSignLogTimeValue(right) - getSignLogTimeValue(left);
      return order === 'newest' ? difference : -difference;
    })
  ), [logs, order]);
  const visibleLogs = useMemo(
    () => sortedLogs.slice(offset, offset + limit),
    [limit, offset, sortedLogs],
  );
  const courseGroups = useMemo(() => {
    const groups = new Map<string, SignLog[]>();
    visibleLogs.forEach((log) => {
      const courseName = log.courseName ?? '课程未记录';
      const group = groups.get(courseName) ?? [];
      group.push(log);
      groups.set(courseName, group);
    });
    return [...groups.entries()];
  }, [visibleLogs]);
  const currentPage = Math.floor(offset / limit) + 1;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <Card className="min-w-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-xs">
      <CardHeader className="flex flex-col gap-3 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold sm:text-base">
            <History className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">签到监控记录</span>
          </CardTitle>
          <CardDescription className="mt-1 text-xs">最近捕获的签到历史</CardDescription>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <label className="relative min-w-0 flex-1 sm:w-[104px] sm:flex-none">
            <span className="sr-only">记录视图</span>
            <Layers3 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={view}
              onChange={(event) => setView(event.target.value as SignLogView)}
              className="h-10 w-full rounded-lg border border-input bg-card pl-8 pr-2 text-xs font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-8"
            >
              <option value="time">按时间</option>
              <option value="course">按课程</option>
            </select>
          </label>

          <label className="relative min-w-0 flex-1 sm:w-[112px] sm:flex-none">
            <span className="sr-only">时间排序</span>
            <ArrowDownUp className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={order}
              onChange={(event) => setOrder(event.target.value as SignLogOrder)}
              className="h-10 w-full rounded-lg border border-input bg-card pl-8 pr-2 text-xs font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-8"
            >
              <option value="newest">最新优先</option>
              <option value="oldest">最早优先</option>
            </select>
          </label>

          <Button
            size="icon"
            variant="ghost"
            disabled={loading}
            onClick={onRefresh}
            className="h-10 w-10 shrink-0 rounded-lg hover:bg-muted sm:h-8 sm:w-8"
            title="刷新日志"
            aria-label="刷新签到日志"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {errors.length > 0 && (
          <div
            className="border-b border-warning/25 bg-warning-container/45 px-4 py-3 text-xs text-warning sm:px-6"
            role="alert"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 space-y-1">
                <p className="font-semibold">{errors.length} 门课程的签到历史读取失败</p>
                {errors.map((item) => (
                  <p key={item.classId} className="break-words text-muted-foreground">
                    {item.courseName}：{item.error}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="max-h-[600px] min-h-[260px] overflow-y-auto">
          {loading && logs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-12 text-xs text-muted-foreground">
              <svg className="google-spinner" viewBox="0 0 50 50">
                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
              </svg>
              <p className="mt-4">拉取签到日志中...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-12 text-center text-xs text-muted-foreground">
              <AlertCircle className="h-8 w-8 text-muted" />
              <p>暂无签到日志记录</p>
            </div>
          ) : view === 'course' ? (
            <div className="divide-y divide-border/60">
              {courseGroups.map(([courseName, courseLogs]) => (
                <section key={courseName}>
                  <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border/40 bg-muted/80 px-4 py-2 backdrop-blur-sm sm:px-6">
                    <h3 className="truncate text-xs font-semibold text-foreground sm:text-sm">{courseName}</h3>
                    <Badge variant="outline" className="bg-card/80 text-muted-foreground">
                      {courseLogs.length} 条
                    </Badge>
                  </div>
                  <div className="divide-y divide-border/40">
                    {courseLogs.map((log) => <SignLogRow key={log.id} log={log} showCourse={false} />)}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {visibleLogs.map((log) => <SignLogRow key={log.id} log={log} />)}
            </div>
          )}
        </div>

        {total > limit && (
          <div className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-4 py-3 select-none">
            <span className="text-xs text-muted-foreground">
              共 {total} 条 · 第 {currentPage}/{pageCount} 页
            </span>

            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-lg sm:h-8 sm:w-8"
                disabled={offset === 0}
                title="上一页"
                aria-label="上一页"
                onClick={onPreviousPage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-lg sm:h-8 sm:w-8"
                disabled={offset + limit >= total}
                title="下一页"
                aria-label="下一页"
                onClick={onNextPage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
