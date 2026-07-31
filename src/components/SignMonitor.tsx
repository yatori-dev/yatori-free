import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  startSignMonitor,
  stopSignMonitor,
  getSignLogs,
  getUserFacingErrorMessage,
  isAuthExitError,
} from '@/lib/api';
import type { SignLog } from '@/lib/api';
import type { SignHistoryError } from '@/lib/api';
import type { SignLogsResponseData } from '@/lib/api';
import { getSessionCached, readSessionCache, writeSessionCache } from '@/lib/sessionCache';
import {
  getSignMonitorExpiresStorageKey,
  readStoredMonitorExpiresAt,
} from '@/lib/signMonitor';
import {
  Play,
  Square,
  RefreshCw,
  AlertCircle,
  History,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const SIGN_LOGS_CACHE_PREFIX = 'sign-logs:';

function getSignLogsCacheKey(accountId: string, limit: number, offset: number) {
  return `${SIGN_LOGS_CACHE_PREFIX}${accountId}:${limit}:${offset}`;
}

function getMonitorExpiresAt(startedAt?: string | null, maxRunSeconds?: number) {
  if (!startedAt || typeof maxRunSeconds !== 'number' || maxRunSeconds <= 0) return null;
  const startedAtTime = Date.parse(startedAt);
  const expiresAt = startedAtTime + maxRunSeconds * 1000;
  return Number.isFinite(expiresAt) && expiresAt > Date.now() ? expiresAt : null;
}

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
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

interface SignMonitorProps {
  accountId: string;
  onUnauthorized: () => void;
  onStatusChange?: (active: boolean) => void;
}

export const SignMonitor: React.FC<SignMonitorProps> = ({
  accountId,
  onUnauthorized,
  onStatusChange,
}) => {
  const logsLimit = 10;
  const initialLogs = readSessionCache<SignLogsResponseData>(
    getSignLogsCacheKey(accountId, logsLimit, 0),
  );
  const [logs, setLogs] = useState<SignLog[]>(() => initialLogs?.logs ?? []);
  const [logsTotal, setLogsTotal] = useState(() => initialLogs?.total ?? 0);
  const [historyErrors, setHistoryErrors] = useState<SignHistoryError[]>(
    () => initialLogs?.errors ?? [],
  );
  const [logsLoading, setLogsLoading] = useState(() => initialLogs === undefined);
  const [toggleAction, setToggleAction] = useState<'start' | 'stop' | null>(null);
  const [monitorState, setMonitorState] = useState(() => ({
    accountId,
    expiresAt: readStoredMonitorExpiresAt(accountId),
  }));
  const [now, setNow] = useState(() => Date.now());
  const [logsPage, setLogsPage] = useState(() => ({ accountId, offset: 0 }));
  const logsOffset = logsPage.accountId === accountId ? logsPage.offset : 0;
  const monitorExpiresAt = monitorState.accountId === accountId
    ? monitorState.expiresAt
    : readStoredMonitorExpiresAt(accountId);
  const monitorRemainingMs = monitorExpiresAt ? Math.max(0, monitorExpiresAt - now) : 0;
  const monitorStarted = monitorRemainingMs > 0;

  useEffect(() => {
    onStatusChange?.(monitorStarted);
  }, [monitorStarted, onStatusChange]);

  const fetchLogs = useCallback(async (showLoading = true, useCache = true) => {
    if (showLoading) setLogsLoading(true);
    try {
      const cacheKey = getSignLogsCacheKey(accountId, logsLimit, logsOffset);
      const loadLogs = async () => {
        const response = await getSignLogs(accountId, { limit: logsLimit, offset: logsOffset });
        return response.data;
      };
      const data = useCache
        ? await getSessionCached(cacheKey, loadLogs)
        : await loadLogs();
      writeSessionCache(cacheKey, data);
      setLogs(data.logs);
      setLogsTotal(data.total);
      setHistoryErrors(Array.isArray(data.errors) ? data.errors : []);
    } catch (error) {
      if (isAuthExitError(error)) {
        toast.error(getUserFacingErrorMessage(error, '登录已失效，请重新登录'));
        onUnauthorized();
        return;
      }
      console.error(error);
      toast.error(getUserFacingErrorMessage(error, '加载签到记录失败，请稍后重试'));
    } finally {
      if (showLoading) setLogsLoading(false);
    }
  }, [accountId, logsLimit, logsOffset, onUnauthorized]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchLogs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchLogs]);

  useEffect(() => {
    if (!monitorExpiresAt) return;

    const timer = window.setInterval(() => {
      const nextNow = Date.now();
      setNow(nextNow);

      if (nextNow >= monitorExpiresAt) {
        localStorage.removeItem(getSignMonitorExpiresStorageKey(accountId));
        setMonitorState({ accountId, expiresAt: null });
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [accountId, monitorExpiresAt]);

  const handleMonitorAction = async (action: 'start' | 'stop') => {
    setToggleAction(action);
    try {
      if (action === 'start') {
        const response = await startSignMonitor(accountId);
        const expiresAt = getMonitorExpiresAt(response.data.startedAt, response.data.maxRunSeconds);
        if (expiresAt) {
          localStorage.setItem(getSignMonitorExpiresStorageKey(accountId), String(expiresAt));
        } else {
          localStorage.removeItem(getSignMonitorExpiresStorageKey(accountId));
        }
        setNow(Date.now());
        setMonitorState({ accountId, expiresAt });
        toast.success('签到监测已启动');
      } else {
        await stopSignMonitor(accountId);
        localStorage.removeItem(getSignMonitorExpiresStorageKey(accountId));
        setMonitorState({ accountId, expiresAt: null });
        toast.success('签到监测已停止');
      }
      void fetchLogs(false, false);
    } catch (error) {
      if (isAuthExitError(error)) {
        toast.error(getUserFacingErrorMessage(error, '登录已失效，请重新登录'));
        onUnauthorized();
        return;
      }
      toast.error(
        getUserFacingErrorMessage(
          error,
          `${action === 'start' ? '启动' : '停止'}签到监测失败，请稍后重试`,
        ),
      );
    } finally {
      setToggleAction(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* 自动签到：常驻状态装置 */}
      {!monitorStarted ? (
        /* Stopped State: Quiet Launcher Card */
        <Card className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
          <CardHeader className="flex flex-col gap-4 p-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-foreground">自动签到监测</CardTitle>
                <Badge variant="outline" className="text-xs text-muted-foreground">未运行</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="shrink-0 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">普通签到</span>
                <span className="shrink-0 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">手势签到</span>
                <span className="shrink-0 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">位置签到</span>
                <span className="shrink-0 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">签到码</span>
              </div>
            </div>

            <div className="flex items-center shrink-0 pt-2 sm:pt-0">
              <Button
                type="button"
                disabled={toggleAction !== null}
                onClick={() => void handleMonitorAction('start')}
                className="h-10 w-full sm:w-auto items-center gap-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground px-5 text-sm font-semibold shadow-xs transition-all"
              >
                {toggleAction !== null ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>启动监测</span>
              </Button>
            </div>
          </CardHeader>
        </Card>
      ) : (
        /* Active State: Status Instrument Dashboard Widget */
        <Card className="rounded-xl border border-primary/30 bg-primary-container/20 p-4 sm:p-6 shadow-sm animate-in fade-in-0 duration-300">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              {/* Circular border timer */}
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card text-primary shadow-xs">
                <span className="h-2 w-2 rounded-full bg-primary animate-ping absolute -top-0.5 -right-0.5" />
                <Play className="h-5 w-5 fill-current ml-0.5 text-primary" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">监测中</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
                <div className="tabular-nums font-mono text-xl sm:text-2xl font-bold text-foreground">
                  {formatCountdown(monitorRemainingMs)}
                </div>
              </div>
            </div>

            <div className="flex items-center shrink-0">
              <Button
                type="button"
                variant="outline"
                disabled={toggleAction !== null}
                onClick={() => void handleMonitorAction('stop')}
                className="h-10 w-full sm:w-auto items-center gap-2 rounded-lg border-danger/30 text-danger hover:bg-danger-container/40 hover:border-danger px-4 text-xs font-semibold shadow-xs transition-colors"
              >
                {toggleAction !== null ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Square className="w-4 h-4 fill-current" />
                )}
                <span>停止监测</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Log History */}
      <Card className="min-w-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold sm:text-base">
              <History className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">签到监控记录</span>
            </CardTitle>
            <CardDescription className="mt-1 text-xs">最近捕获的签到历史</CardDescription>
          </div>
          <Button
            size="icon"
            variant="ghost"
            disabled={logsLoading}
            onClick={() => void fetchLogs(true, false)}
            className="h-8 w-8 rounded-full hover:bg-muted shrink-0"
            title="刷新日志"
            aria-label="刷新签到日志"
          >
            <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {historyErrors.length > 0 && (
            <div
              className="border-b border-warning/25 bg-warning-container/45 px-4 py-3 text-xs text-warning sm:px-6"
              role="alert"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold">{historyErrors.length} 门课程的签到历史读取失败</p>
                  {historyErrors.map((item) => (
                    <p key={item.classId} className="break-words text-muted-foreground">
                      {item.courseName}：{item.error}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="max-h-[600px] min-h-[260px] overflow-y-auto">
            {logsLoading && logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground text-xs h-full">
                <svg className="google-spinner" viewBox="0 0 50 50">
                  <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
                </svg>
                <p className="mt-4">拉取签到日志中...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground text-xs text-center h-full gap-2">
                <AlertCircle className="w-8 h-8 text-muted" />
                <p>暂无签到日志记录</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {logs.map((log) => {
                  const logDate = formatLogDateTime(log.createdAt);
                  const isSuccess = log.result?.includes('成功') || log.result?.includes('完成');
                  const isFailure = log.result?.includes('失败') || log.result?.includes('异常');
                  return (
                    <div key={log.id} className="flex flex-col gap-2 p-4 transition-colors hover:bg-muted/30 animate-in fade-in-0 slide-in-from-top-1 duration-200 sm:gap-1.5">
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate sm:text-sm">
                          {log.courseName ?? '课程未记录'}
                        </span>
                        <span className={`shrink-0 text-xs font-semibold rounded-md px-2 py-0.5 ${
                          isSuccess
                            ? 'bg-success-container/60 text-success border border-success/20'
                            : isFailure
                              ? 'bg-danger-container/60 text-danger border border-danger/20'
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {log.result}
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {logDate}
                      </div>

                      {/* Unified Neutral Badge for Sign Type */}
                      <Badge variant="outline" className="w-fit border-border bg-muted/50 text-muted-foreground font-medium text-xs">
                        {log.signName}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {logsTotal > logsLimit && (
            <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between bg-muted/20 select-none">
              <span className="text-xs text-muted-foreground">
                共 {logsTotal} 条记录, 第 {Math.floor(logsOffset / logsLimit) + 1} 页
              </span>

              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-md"
                  disabled={logsOffset === 0}
                  title="上一页"
                  aria-label="上一页"
                  onClick={() => setLogsPage(prev => ({
                    accountId,
                    offset: Math.max(0, (prev.accountId === accountId ? prev.offset : 0) - logsLimit),
                  }))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-md"
                  disabled={logsOffset + logsLimit >= logsTotal}
                  title="下一页"
                  aria-label="下一页"
                  onClick={() => setLogsPage(prev => ({
                    accountId,
                    offset: (prev.accountId === accountId ? prev.offset : 0) + logsLimit,
                  }))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
