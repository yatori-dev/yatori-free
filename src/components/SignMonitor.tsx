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

const SIGN_MONITOR_EXPIRES_STORAGE_PREFIX = 'yatori-sign-monitor-expires-at:';

function getSignMonitorExpiresStorageKey(accountId: string) {
  return `${SIGN_MONITOR_EXPIRES_STORAGE_PREFIX}${accountId}`;
}

function readStoredMonitorExpiresAt(accountId: string) {
  const raw = localStorage.getItem(getSignMonitorExpiresStorageKey(accountId));
  if (!raw) return null;

  const expiresAt = Number(raw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    localStorage.removeItem(getSignMonitorExpiresStorageKey(accountId));
    return null;
  }

  return expiresAt;
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
}

export const SignMonitor: React.FC<SignMonitorProps> = ({
  accountId,
  onUnauthorized,
}) => {
  const [logs, setLogs] = useState<SignLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const [toggleAction, setToggleAction] = useState<'start' | 'stop' | null>(null);
  const [monitorState, setMonitorState] = useState(() => ({
    accountId,
    expiresAt: readStoredMonitorExpiresAt(accountId),
  }));
  const [now, setNow] = useState(() => Date.now());
  const [logsLimit] = useState(10);
  const [logsPage, setLogsPage] = useState(() => ({ accountId, offset: 0 }));
  const logsOffset = logsPage.accountId === accountId ? logsPage.offset : 0;
  const monitorExpiresAt = monitorState.accountId === accountId
    ? monitorState.expiresAt
    : readStoredMonitorExpiresAt(accountId);
  const monitorRemainingMs = monitorExpiresAt ? Math.max(0, monitorExpiresAt - now) : 0;
  const monitorStarted = monitorRemainingMs > 0;
  const nextMonitorAction = monitorStarted ? 'stop' : 'start';

  const fetchLogs = useCallback(async (showLoading = true) => {
    if (showLoading) setLogsLoading(true);
    try {
      const response = await getSignLogs(accountId, { limit: logsLimit, offset: logsOffset });
      setLogs(response.data.logs);
      setLogsTotal(response.data.total);
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
      void fetchLogs(false);
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
    <div className="flex flex-col gap-6">
      <Card className="bg-card shadow-sm border-none">
        <CardHeader className="py-4 px-6 flex flex-row items-center justify-between gap-4 space-y-0">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-semibold">自动签到</CardTitle>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="text-[9px] sm:text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-100/50 dark:border-emerald-900/30 shrink-0 select-none">普通签到</span>
              <span className="text-[9px] sm:text-[10px] font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100/50 dark:border-blue-900/30 shrink-0 select-none">手势签到</span>
              <span className="text-[9px] sm:text-[10px] font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-100/50 dark:border-amber-900/30 shrink-0 select-none">位置签到</span>
              <span className="text-[9px] sm:text-[10px] font-medium bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded border border-purple-100/50 dark:border-purple-900/30 shrink-0 select-none">签到码</span>
            </div>
          </div>
          <div className="flex items-center shrink-0">
            <Button
              type="button"
              disabled={toggleAction !== null}
              onClick={() => void handleMonitorAction(nextMonitorAction)}
              className={`font-semibold text-sm h-9 sm:h-10 px-3 sm:px-5 rounded-md flex items-center gap-1.5 sm:gap-2 shadow-sm ${
                monitorStarted
                  ? 'border border-destructive/30 bg-card text-destructive hover:bg-destructive/5 hover:border-destructive'
                  : 'bg-[#1a73e8] hover:bg-[#1557b0] text-white'
              }`}
            >
              {toggleAction !== null ? (
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              ) : monitorStarted ? (
                <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              )}
              <span className="hidden sm:inline">
                {monitorStarted ? `停止监测 ${formatCountdown(monitorRemainingMs)}` : '启动监测'}
              </span>
              <span className="inline sm:hidden text-xs">
                {monitorStarted ? formatCountdown(monitorRemainingMs) : '启动'}
              </span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="bg-card shadow-sm border-none min-w-0 overflow-hidden">
        <CardHeader className="py-4 px-6 border-b border-border/50 flex flex-row items-center justify-between gap-3 space-y-0">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">签到监控记录</span>
            </CardTitle>
            <CardDescription className="text-xs mt-1">最近的签到历史</CardDescription>
          </div>
          <Button
            size="icon"
            variant="ghost"
            disabled={logsLoading}
            onClick={() => void fetchLogs(true)}
            className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-[#2d2e30] shrink-0"
            title="刷新日志"
          >
            <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] min-h-[300px] overflow-y-auto">
            {logsLoading && logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-500 text-sm h-full">
                <svg className="google-spinner" viewBox="0 0 50 50">
                  <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
                </svg>
                <p className="mt-4">拉取签到日志中...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-400 text-xs text-center h-full gap-2">
                <AlertCircle className="w-8 h-8 text-gray-300" />
                <p>暂无签到日志记录</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {logs.map((log) => {
                  const logDate = formatLogDateTime(log.createdAt);
                  return (
                    <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors flex flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {log.courseName ?? '课程未记录'}
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                          {log.result}
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground truncate">
                        {logDate}
                      </div>

                      <Badge variant="secondary" className="w-fit bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                        {log.signName}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {logsTotal > logsLimit && (
            <div className="px-4 py-3 border-t border-border/40 flex items-center justify-between bg-gray-50/10 dark:bg-[#1e2022]/10 select-none">
              <span className="text-[11px] text-muted-foreground">
                共 {logsTotal} 条记录, 第 {Math.floor(logsOffset / logsLimit) + 1} 页
              </span>

              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded"
                  disabled={logsOffset === 0}
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
                  className="h-7 w-7 rounded"
                  disabled={logsOffset + logsLimit >= logsTotal}
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
