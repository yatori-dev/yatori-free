import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  confirmEmailVerification,
  getEmailNotificationSettings,
  getUserFacingErrorMessage,
  isAuthExitError,
  requestEmailVerification,
  updateEmailNotification,
} from '@/lib/api';
import type { EmailNotificationSettings as EmailNotificationSettingsData } from '@/lib/api';
import { notifyAuthExit } from '@/lib/notifications';
import { getSessionCached, readSessionCache, writeSessionCache } from '@/lib/sessionCache';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

interface EmailNotificationSettingsProps {
  onUnauthorized: () => void;
}

type PendingAction = 'load' | 'send' | 'confirm' | 'toggle' | null;
const EMAIL_NOTIFICATION_CACHE_KEY = 'email-notification-settings';

export function EmailNotificationSettings({ onUnauthorized }: EmailNotificationSettingsProps) {
  const initialSettings = readSessionCache<EmailNotificationSettingsData>(EMAIL_NOTIFICATION_CACHE_KEY);
  const [settings, setSettings] = useState<EmailNotificationSettingsData | null>(() => initialSettings ?? null);
  const [email, setEmail] = useState(() => initialSettings?.pendingEmail || initialSettings?.email || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(() => initialSettings ? null : 'load');

  const handleError = useCallback((error: unknown, fallback: string) => {
    if (isAuthExitError(error)) {
      notifyAuthExit(getUserFacingErrorMessage(error, '登录已失效，请重新登录'));
      onUnauthorized();
      return;
    }

    toast.error(getUserFacingErrorMessage(error, fallback));
  }, [onUnauthorized]);

  const applySettings = useCallback((next: EmailNotificationSettingsData) => {
    writeSessionCache(EMAIL_NOTIFICATION_CACHE_KEY, next);
    setSettings(next);
    setEmail(next.pendingEmail || next.email);
  }, []);

  useEffect(() => {
    let cancelled = false;

    getSessionCached(EMAIL_NOTIFICATION_CACHE_KEY, async () => {
      const response = await getEmailNotificationSettings();
      return response.data;
    })
      .then((nextSettings) => {
        if (!cancelled) {
          applySettings(nextSettings);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          handleError(error, '获取邮箱通知设置失败');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPendingAction(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applySettings, handleError]);

  const handleRequestVerification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextEmail = email.trim();
    if (!nextEmail) return;

    setPendingAction('send');
    try {
      const response = await requestEmailVerification({ email: nextEmail });
      applySettings(response.data);
      setVerificationCode('');
      toast.success('验证码已发送');
    } catch (error) {
      handleError(error, '发送验证码失败');
    } finally {
      setPendingAction(null);
    }
  };

  const handleConfirmVerification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = verificationCode.trim();
    if (!code) return;

    setPendingAction('confirm');
    try {
      const response = await confirmEmailVerification({ code });
      applySettings(response.data);
      setVerificationCode('');
      toast.success('邮箱验证成功');
    } catch (error) {
      handleError(error, '验证邮箱失败');
    } finally {
      setPendingAction(null);
    }
  };

  const handleEnabledChange = async (enabled: boolean) => {
    setPendingAction('toggle');
    try {
      const response = await updateEmailNotification({ enabled });
      applySettings(response.data);
      toast.success(enabled ? '邮件通知已开启' : '邮件通知已关闭');
    } catch (error) {
      handleError(error, '更新邮件通知失败');
    } finally {
      setPendingAction(null);
    }
  };

  const isBusy = pendingAction !== null;
  const hasVerifiedEmail = settings?.verified === true && Boolean(settings.email);
  const hasPendingEmail = Boolean(settings?.pendingEmail);
  const statusText = !settings?.available
    ? '邮件服务暂不可用'
    : hasPendingEmail
      ? `待验证：${settings.pendingEmail}`
      : '任务成功/失败时发送邮件';

  return (
    <div className="space-y-4 rounded-lg border border-border/50 bg-muted/25 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-1.5 pr-4">
          <Label htmlFor="emailNotificationEnabled" className="block cursor-pointer text-sm font-semibold text-[#191c1d] dark:text-[#e3e3e3]">
            任务状态邮件通知
          </Label>
          <p className="truncate text-xs leading-relaxed text-gray-500 dark:text-gray-400" title={hasPendingEmail ? settings?.pendingEmail : undefined}>
            {statusText}
          </p>
        </div>
        <Switch
          id="emailNotificationEnabled"
          checked={settings?.enabled ?? false}
          disabled={!hasVerifiedEmail || !settings?.available || isBusy}
          onCheckedChange={(checked) => void handleEnabledChange(checked)}
          className="shrink-0"
        />
      </div>

      {pendingAction === 'load' ? (
        <p className="text-xs text-muted-foreground">正在读取邮箱设置...</p>
      ) : (
        <div className="animate-in fade-in-0 slide-in-from-top-1 duration-300 ease-out motion-reduce:animate-none">
          <div className={`grid grid-cols-1 gap-3 border-t border-border/40 pt-4 ${hasPendingEmail ? 'lg:grid-cols-2 lg:gap-4' : ''}`}>
            <form className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2" onSubmit={handleRequestVerification}>
              <Label htmlFor="notificationEmail" className="sr-only">邮箱地址</Label>
              <Input
                id="notificationEmail"
                type="email"
                value={email}
                disabled={!settings?.available || isBusy}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="邮箱地址"
                autoComplete="email"
                required
                className="bg-background text-[13px] md:text-[13px]"
                aria-label="邮箱地址"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={!settings?.available || isBusy || !email.trim()}
              >
                {pendingAction === 'send' ? '发送中...' : '发送验证码'}
              </Button>
            </form>

            {hasPendingEmail && (
              <form className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2" onSubmit={handleConfirmVerification}>
                <Label htmlFor="emailVerificationCode" className="sr-only">邮箱验证码</Label>
                <Input
                  id="emailVerificationCode"
                  value={verificationCode}
                  disabled={isBusy}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder="验证码"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  className="bg-background text-[13px] md:text-[13px]"
                  aria-label="邮箱验证码"
                />
                <Button
                  type="submit"
                  disabled={isBusy || !verificationCode.trim()}
                >
                  {pendingAction === 'confirm' ? '验证中...' : '确认验证'}
                </Button>
              </form>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
