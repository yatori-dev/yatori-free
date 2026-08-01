import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { SignLogHistory } from './sign-monitor/SignLogHistory';
import { SIGN_TYPE_BADGES } from './sign-monitor/sign-log-presentation';
import {
  startSignMonitor,
  stopSignMonitor,
  getAllSignLogs,
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
} from 'lucide-react';
import { toast } from 'sonner';

const SIGN_LOGS_CACHE_PREFIX = 'sign-logs:';
const SIGN_LOGS_PAGE_SIZE = 10;

function getSignLogsCacheKey(accountId: string) {
  return `${SIGN_LOGS_CACHE_PREFIX}${accountId}:all`;
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
  const initialLogs = readSessionCache<SignLogsResponseData>(
    getSignLogsCacheKey(accountId),
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
      const cacheKey = getSignLogsCacheKey(accountId);
      const loadLogs = async () => {
        const response = await getAllSignLogs(accountId);
        return response.data;
      };
      const data = useCache
        ? await getSessionCached(cacheKey, loadLogs)
        : await loadLogs();
      writeSessionCache(cacheKey, data);
      setLogs(data.logs);
      setLogsTotal(data.total);
      setHistoryErrors(Array.isArray(data.errors) ? data.errors : []);
      setLogsPage((previous) => {
        const previousOffset = previous.accountId === accountId ? previous.offset : 0;
        const maxOffset = Math.max(
          0,
          Math.floor((Math.max(0, data.total - 1)) / SIGN_LOGS_PAGE_SIZE) * SIGN_LOGS_PAGE_SIZE,
        );
        return { accountId, offset: Math.min(previousOffset, maxOffset) };
      });
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
  }, [accountId, onUnauthorized]);

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
                {SIGN_TYPE_BADGES.map((item) => (
                  <Badge key={item.label} variant="outline" className={item.className}>
                    {item.label}
                  </Badge>
                ))}
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

      <SignLogHistory
        errors={historyErrors}
        limit={SIGN_LOGS_PAGE_SIZE}
        loading={logsLoading}
        logs={logs}
        offset={logsOffset}
        onPageChange={(offset) => setLogsPage({
          accountId,
          offset,
        })}
        onRefresh={() => void fetchLogs(true, false)}
        total={logsTotal}
      />
    </div>
  );
};
