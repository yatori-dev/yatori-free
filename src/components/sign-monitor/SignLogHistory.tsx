import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
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
  isSignResultSuccess,
} from './sign-log-presentation';
import { SignLogViewMenu } from './SignLogViewMenu';
import type { SignLogView } from './SignLogViewMenu';

interface SignLogHistoryProps {
  errors: SignHistoryError[];
  limit: number;
  loading: boolean;
  logs: SignLog[];
  offset: number;
  onPageChange: (offset: number) => void;
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
  onPageChange,
  onRefresh,
  total,
}: SignLogHistoryProps) {
  const [view, setView] = useState<SignLogView>('time');
  const sortedLogs = useMemo(() => (
    [...logs].sort((left, right) => {
      const timeDifference = getSignLogTimeValue(right) - getSignLogTimeValue(left);
      if (view === 'time') return timeDifference;

      const courseDifference = (left.courseName ?? '课程未记录').localeCompare(
        right.courseName ?? '课程未记录',
        'zh-CN',
      );
      return courseDifference || timeDifference;
    })
  ), [logs, view]);
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
  const signedCount = useMemo(
    () => logs.filter((log) => isSignResultSuccess(log.result)).length,
    [logs],
  );
  const [pageDraft, setPageDraft] = useState(() => ({
    page: currentPage,
    value: String(currentPage),
  }));
  const pageInput = pageDraft.page === currentPage ? pageDraft.value : String(currentPage);

  const goToPage = (requestedPage: number) => {
    const page = Math.min(pageCount, Math.max(1, requestedPage));
    setPageDraft({ page, value: String(page) });
    onPageChange((page - 1) * limit);
  };

  const submitPageInput = () => {
    const requestedPage = Number.parseInt(pageInput, 10);
    goToPage(Number.isFinite(requestedPage) ? requestedPage : currentPage);
  };

  return (
    <Card className="min-w-0 overflow-visible rounded-xl border border-border bg-card p-0 shadow-xs">
      <CardHeader className="relative z-20 flex flex-col gap-3 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold sm:text-base">
            <ClipboardCheck className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">账户签到记录</span>
          </CardTitle>
          <CardDescription className="mt-1 text-xs">全部课程签到信息</CardDescription>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <SignLogViewMenu
            value={view}
            onChange={(value) => {
              setView(value);
              onPageChange(0);
            }}
          />

          <Button
            size="icon"
            variant="ghost"
            disabled={loading}
            onClick={onRefresh}
            className="h-11 w-11 shrink-0 rounded-lg hover:bg-muted sm:h-10 sm:w-10"
            title="刷新日志"
            aria-label="刷新签到日志"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative z-0 overflow-hidden rounded-b-xl p-0">
        {errors.length > 0 && (
          <div
            className="border-b border-warning/25 bg-warning-container/45 px-4 py-3 text-xs text-warning sm:px-6"
            role="alert"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 space-y-1">
                <p className="font-semibold">{errors.length} 门课程的签到记录读取失败</p>
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
              <p className="mt-4">读取账户签到记录中...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-12 text-center text-xs text-muted-foreground">
              <AlertCircle className="h-8 w-8 text-muted" />
              <p>暂无签到记录</p>
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

        <div className="flex flex-col gap-3 border-t border-border/50 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            已签到 <span className="font-semibold tabular-nums text-success">{signedCount}</span>
            {' / '}
            <span className="tabular-nums text-foreground">{total}</span> 条
          </p>

          <form
            className="flex items-center justify-between gap-1 sm:justify-end"
            aria-label="签到记录分页"
            onSubmit={(event) => {
              event.preventDefault();
              submitPageInput();
            }}
          >
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-11 w-11 rounded-lg"
                disabled={currentPage === 1}
                title="第一页"
                aria-label="第一页"
                onClick={() => goToPage(1)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-11 w-11 rounded-lg"
                disabled={currentPage === 1}
                title="上一页"
                aria-label="上一页"
                onClick={() => goToPage(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            <label className="flex h-11 items-center gap-1 rounded-lg border border-input bg-card px-2 text-xs text-muted-foreground focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <span className="sr-only">当前页码</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pageInput}
                onChange={(event) => setPageDraft({
                  page: currentPage,
                  value: event.target.value.replace(/\D/g, ''),
                })}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return;
                  event.preventDefault();
                  submitPageInput();
                }}
                onBlur={submitPageInput}
                className="w-7 bg-transparent text-center font-semibold tabular-nums text-foreground outline-none"
                aria-label={`当前第 ${currentPage} 页，共 ${pageCount} 页`}
              />
              <span aria-hidden="true">/</span>
              <span className="min-w-4 tabular-nums" aria-hidden="true">{pageCount}</span>
            </label>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-11 w-11 rounded-lg"
                disabled={currentPage === pageCount}
                title="下一页"
                aria-label="下一页"
                onClick={() => goToPage(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-11 w-11 rounded-lg"
                disabled={currentPage === pageCount}
                title="最后一页"
                aria-label="最后一页"
                onClick={() => goToPage(pageCount)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
