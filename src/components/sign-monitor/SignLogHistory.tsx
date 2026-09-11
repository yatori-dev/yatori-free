import { useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  RefreshCw,
  Users,
} from 'lucide-react';
import type { SignHistoryError, SignLog } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  compareSignLogsNewestFirst,
  getSignLogTimestamp,
  getSignDisplayName,
  getSignResult,
  getSignResultClassName,
  getSignTypeBadge,
  isSignResultSuccess,
} from './sign-log-presentation';
import { formatLocalDateTime } from '@/lib/format';

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

function SignLogRow({ log, showCourse = true }: { log: SignLog; showCourse?: boolean }) {
  const signType = getSignTypeBadge(log);
  const signResult = getSignResult(log);
  const isSuccess = isSignResultSuccess(log);
  const hasAttendanceCount = typeof log.signedCount === 'number'
    && typeof log.totalCount === 'number';

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 transition-colors duration-150 hover:bg-muted/30">
      <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3">
        {/* Status indicator icon */}
        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
          isSuccess
            ? 'bg-success-container/40 text-success'
            : 'bg-muted/60 text-muted-foreground'
        }`}>
          {isSuccess ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="truncate text-xs font-semibold text-foreground sm:text-sm">
              {showCourse ? (log.courseName ?? '课程未记录') : getSignDisplayName(log)}
            </span>
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium border leading-none ${signType.className}`}>
              {getSignDisplayName(log)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">
              {formatLocalDateTime(getSignLogTimestamp(log), { fallback: getSignLogTimestamp(log), includeYear: true })}
            </span>
            {hasAttendanceCount && (
              <span className="inline-flex items-center gap-1 font-medium tabular-nums text-foreground/70">
                <Users className="h-3 w-3" aria-hidden="true" />
                已签到 {log.signedCount} / {log.totalCount} 人
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center">
        <Badge
          variant="outline"
          className={`shrink-0 text-xs font-semibold ${getSignResultClassName(log)}`}
        >
          {signResult}
        </Badge>
      </div>
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
  const sortedLogs = useMemo(() => (
    [...logs].sort(compareSignLogsNewestFirst)
  ), [logs]);
  const visibleLogs = useMemo(
    () => sortedLogs.slice(offset, offset + limit),
    [limit, offset, sortedLogs],
  );
  const currentPage = Math.floor(offset / limit) + 1;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const signedCount = useMemo(
    () => logs.filter(isSignResultSuccess).length,
    [logs],
  );

  const goToPage = (requestedPage: number) => {
    const page = Math.min(pageCount, Math.max(1, requestedPage));
    onPageChange((page - 1) * limit);
  };

  return (
    <Card className="min-w-0 flex-1 flex flex-col overflow-hidden rounded-none border-x-0 border-t-0 bg-card p-0 sm:rounded-xl sm:border sm:border-border sm:shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 px-4 py-3 sm:px-6 sm:py-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <ClipboardCheck className="h-4 w-4 shrink-0 text-primary" />
          <CardTitle className="text-sm font-semibold sm:text-base">签到历史</CardTitle>
          <span className="text-xs text-muted-foreground tabular-nums">({total})</span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            disabled={loading}
            onClick={onRefresh}
            className="h-8 w-8 shrink-0 rounded-md hover:bg-muted"
            title="刷新签到记录"
            aria-label="刷新签到记录"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
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

        <div className="flex-1 min-h-[260px] max-h-[600px] overflow-y-auto">
          {loading && logs.length === 0 ? (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center p-12 text-xs text-muted-foreground">
              <svg className="google-spinner" viewBox="0 0 50 50">
                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
              </svg>
              <p className="mt-4">读取账户签到记录中...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-2 p-12 text-center text-xs text-muted-foreground">
              <AlertCircle className="h-8 w-8 text-muted" />
              <p>暂无签到记录</p>
            </div>
          ) : (
            <div
              key={offset}
              className="animate-in fade-in-50 duration-200"
            >
              <div className="divide-y divide-border/40">
                {visibleLogs.map((log) => <SignLogRow key={log.id} log={log} />)}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5 border-t border-border/50 bg-muted/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            第 <span className="font-semibold text-foreground">{currentPage}</span> / {pageCount} 页
            <span className="mx-1.5 text-border">·</span>
            共 <span className="font-semibold text-foreground">{total}</span> 条
            <span className="mx-1 text-muted-foreground/60">（已签到</span>
            <span className="font-semibold tabular-nums text-success">{signedCount}</span>
            <span className="text-muted-foreground/60">条）</span>
          </p>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs gap-1 rounded-md"
              disabled={currentPage <= 1 || loading}
              onClick={() => goToPage(currentPage - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>上一页</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs gap-1 rounded-md"
              disabled={currentPage >= pageCount || loading}
              onClick={() => goToPage(currentPage + 1)}
            >
              <span>下一页</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
