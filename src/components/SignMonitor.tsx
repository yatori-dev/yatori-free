import React, { useState, useEffect, useCallback } from 'react';
import { useSignMonitorCountdown } from '@/hooks/useSignMonitorCountdown';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { SignLogHistory } from './sign-monitor/SignLogHistory';
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
  Radio,
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
  const [historyErrors, setHistoryErrors] = useState<SignHistoryError[]>(
    () => initialLogs?.errors ?? [],
  );
  const [logsLoading, setLogsLoading] = useState(() => initialLogs === undefined);
  const [toggleAction, setToggleAction] = useState<'start' | 'stop' | null>(null);
  const [monitorState, setMonitorState] = useState(() => ({
    accountId,
    expiresAt: readStoredMonitorExpiresAt(accountId),
  }));
  const [logsPage, setLogsPage] = useState(() => ({ accountId, offset: 0 }));
  const logsOffset = logsPage.accountId === accountId ? logsPage.offset : 0;
  const monitorExpiresAt = monitorState.accountId === accountId
    ? monitorState.expiresAt
    : readStoredMonitorExpiresAt(accountId);
  const { remainingMs: monitorRemainingMs, started: monitorStarted } = useSignMonitorCountdown(monitorExpiresAt);

  useEffect(() => {
    onStatusChange?.(monitorStarted);
  }, [monitorStarted, onStatusChange]);

  const fetchLogs = useCallback(async (showLoading = true, useCache = true) => {
    if (showLoading) setLogsLoading(true);
    try {
      const cacheKey = getSignLogsCacheKey(accountId);
      const loadLogs = async () => {
        const response = await getSignLogs(accountId);
        return response.data;
      };
      const data = useCache
        ? await getSessionCached(cacheKey, loadLogs)
        : await loadLogs();
      writeSessionCache(cacheKey, data);
      setLogs(data.logs);
      setHistoryErrors(Array.isArray(data.errors) ? data.errors : []);
      setLogsPage((previous) => {
        const previousOffset = previous.accountId === accountId ? previous.offset : 0;
        const maxOffset = Math.max(
          0,
          Math.floor((Math.max(0, data.logs.length - 1)) / SIGN_LOGS_PAGE_SIZE) * SIGN_LOGS_PAGE_SIZE,
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
    <div className="flex flex-col gap-3 sm:gap-4 lg:min-h-0 lg:flex-1">
      {/* 自动签到控制卡片 */}
      <Card className="shrink-0 rounded-none border-x-0 border-t-0 border-border/60 bg-card p-4 shadow-rest transition-all duration-200 ease-standard sm:rounded-xl sm:border sm:border-border/70 sm:p-5 hover:shadow-raised">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-xs transition-colors ${
                monitorStarted
                  ? 'bg-success-container/40 text-success'
                  : 'bg-muted/60 text-muted-foreground'
              }`}>
                <Radio className={`h-4 w-4 ${monitorStarted ? 'animate-calm-pulse' : ''}`} />
              </div>

              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="text-sm font-semibold text-foreground sm:text-base">自动签到监测</span>
                {!monitorStarted ? (
                  <Badge variant="outline" className="gap-1.5 border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-normal text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                    未运行
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1.5 border-success/30 bg-success-container/30 px-2.5 py-0.5 text-xs font-medium text-success shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-calm-pulse" />
                    运行中
                    <span className="text-muted-foreground/30">|</span>
                    <span className="text-muted-foreground font-normal">剩余</span>
                    <span className="font-mono font-semibold tabular-nums">{formatCountdown(monitorRemainingMs)}</span>
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed pl-[42px] sm:pl-0">
              {monitorStarted
                ? '后台监听中，倒计时结束或手动停止后退出。'
                : '后台自动提交开放的课程签到（不支持拍照与二维码签到）'}
            </p>
          </div>

          <div className="flex shrink-0 items-center pt-1 sm:pt-0">
            {!monitorStarted ? (
              <Button
                type="button"
                disabled={toggleAction !== null}
                onClick={() => void handleMonitorAction('start')}
                className="h-11 w-auto self-end items-center gap-1.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground px-4 text-xs font-medium shadow-xs transition-colors sm:h-9"
              >
                {toggleAction !== null ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current" />
                )}
                <span>启动监测</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={toggleAction !== null}
                onClick={() => void handleMonitorAction('stop')}
                className="h-11 w-auto self-end items-center gap-1.5 rounded-lg border-danger/30 text-danger hover:bg-danger-container/30 hover:border-danger px-4 text-xs font-medium shadow-xs transition-colors sm:h-9"
              >
                {toggleAction !== null ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Square className="h-3.5 w-3.5 fill-current" />
                )}
                <span>停止监测</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 签到历史记录列表 */}
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
        total={logs.length}
      />
    </div>
  );
};
