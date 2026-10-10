import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  ChevronRight,
  RotateCw,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  confirmEmailVerification,
  getEmailNotificationSettings,
  getUserFacingErrorMessage,
  isAuthExitError,
  requestEmailVerification,
  updateDeadlineEmailNotification,
  updateEmailNotification,
} from "@/lib/api";
import type { EmailNotificationSettings as EmailNotificationSettingsData } from "@/lib/api";
import { notifyAuthExit } from "@/lib/notifications";
import {
  getSessionCached,
  readSessionCache,
  writeSessionCache,
} from "@/lib/sessionCache";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Switch } from "./ui/switch";

interface EmailNotificationSettingsProps {
  onUnauthorized: () => void;
}

type PendingAction =
  | "load"
  | "send"
  | "confirm"
  | "toggle"
  | "deadline"
  | null;

const EMAIL_NOTIFICATION_CACHE_KEY = "email-notification-settings";
const MAX_DEADLINE_REMINDERS = 5;

const PRESET_REMINDERS = [
  { label: "30 分钟前", minutes: 30 },
  { label: "1 小时前", minutes: 60 },
  { label: "2 小时前", minutes: 120 },
  { label: "6 小时前", minutes: 360 },
  { label: "1 天前", minutes: 1440 },
  { label: "2 天前", minutes: 2880 },
] as const;

function formatReminderTime(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainingMinutes = minutes % 60;
  return [
    days && `${days} 天`,
    hours && `${hours} 小时`,
    remainingMinutes && `${remainingMinutes} 分钟`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function EmailNotificationSettings({
  onUnauthorized,
}: EmailNotificationSettingsProps) {
  const initialSettings = readSessionCache<EmailNotificationSettingsData>(
    EMAIL_NOTIFICATION_CACHE_KEY,
  );
  const normalizedInitialSettings = initialSettings
    ? {
        ...initialSettings,
        deadlineReminderMinutes: initialSettings.deadlineReminderMinutes ?? [],
      }
    : null;

  const [settings, setSettings] =
    useState<EmailNotificationSettingsData | null>(
      () => normalizedInitialSettings,
    );
  const [email, setEmail] = useState(
    () => initialSettings?.pendingEmail || initialSettings?.email || "",
  );
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(() =>
    normalizedInitialSettings ? null : "load",
  );

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleError = useCallback(
    (error: unknown, fallback: string) => {
      if (isAuthExitError(error)) {
        notifyAuthExit(
          getUserFacingErrorMessage(error, "登录已失效，请重新登录"),
        );
        onUnauthorized();
        return;
      }
      toast.error(getUserFacingErrorMessage(error, fallback));
    },
    [onUnauthorized],
  );

  const applySettings = useCallback((next: EmailNotificationSettingsData) => {
    const normalized = {
      ...next,
      deadlineReminderMinutes: next.deadlineReminderMinutes ?? [],
    };
    writeSessionCache(EMAIL_NOTIFICATION_CACHE_KEY, normalized);
    setSettings(normalized);
    setEmail(next.pendingEmail || next.email || "");
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
          handleError(error, "获取邮箱通知设置失败");
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

  const handleRequestVerification = async (targetEmail?: string) => {
    const nextEmail = (targetEmail ?? email).trim();
    if (!nextEmail) {
      toast.error("请输入有效的邮箱地址");
      return;
    }

    setPendingAction("send");
    try {
      const response = await requestEmailVerification({ email: nextEmail });
      applySettings(response.data);
      setVerificationCode("");
      setIsEditingEmail(false);
      setResendCountdown(60);
      toast.success("验证码已发送至 " + nextEmail);
    } catch (error) {
      handleError(error, "发送验证码失败");
    } finally {
      setPendingAction(null);
    }
  };

  const handleConfirmVerification = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const code = verificationCode.trim();
    if (!code) {
      toast.error("请输入验证码");
      return;
    }

    setPendingAction("confirm");
    try {
      const response = await confirmEmailVerification({ code });
      applySettings(response.data);
      setVerificationCode("");
      toast.success("邮箱验证成功");
    } catch (error) {
      handleError(error, "验证邮箱失败");
    } finally {
      setPendingAction(null);
    }
  };

  const handleEnabledChange = async (enabled: boolean) => {
    setPendingAction("toggle");
    try {
      const response = await updateEmailNotification({ enabled });
      applySettings(response.data);
      toast.success(enabled ? "邮件通知已开启" : "邮件通知已关闭");
    } catch (error) {
      handleError(error, "更新邮件通知失败");
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeadlineReminderChange = async (nextMinutes: number[]) => {
    setPendingAction("deadline");
    try {
      const response = await updateDeadlineEmailNotification({
        reminderMinutes: nextMinutes,
      });
      applySettings(response.data);
      toast.success(
        nextMinutes.length ? "临期提醒已更新" : "临期提醒已清空",
      );
    } catch (error) {
      handleError(error, "更新临期提醒失败");
    } finally {
      setPendingAction(null);
    }
  };

  const handleAddPreset = (minutes: number) => {
    const current = settings?.deadlineReminderMinutes ?? [];
    if (current.includes(minutes)) return;
    if (current.length >= MAX_DEADLINE_REMINDERS) {
      toast.error(`最多设置 ${MAX_DEADLINE_REMINDERS} 个提醒时间`);
      return;
    }
    const next = [...current, minutes].sort((a, b) => a - b);
    void handleDeadlineReminderChange(next);
  };

  const handleRemoveDeadlineReminder = (minutes: number) => {
    const current = settings?.deadlineReminderMinutes ?? [];
    void handleDeadlineReminderChange(
      current.filter((item) => item !== minutes),
    );
  };

  const isBusy = pendingAction !== null;
  const isAvailable = settings?.available ?? true;
  const hasVerifiedEmail =
    settings?.verified === true && Boolean(settings.email);
  const hasPendingEmail = Boolean(settings?.pendingEmail);
  const deadlineReminderMinutes = settings?.deadlineReminderMinutes ?? [];
  const canAddMoreReminders =
    deadlineReminderMinutes.length < MAX_DEADLINE_REMINDERS;

  if (pendingAction === "load") {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin text-primary" />
        正在读取邮件通知设置...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isAvailable && (
        <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="space-y-0.5">
            <p className="font-medium text-destructive">邮件通知服务暂不可用</p>
            <p className="text-xs text-destructive/80">
              后端通知服务尚未就绪，目前无法发送邮件
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">通知邮箱</h3>
                {hasVerifiedEmail && !hasPendingEmail && (
                  <Badge variant="default" className="h-5 gap-1 text-xs">
                    <Check className="size-3" />
                    已绑定
                  </Badge>
                )}
                {hasPendingEmail && (
                  <Badge variant="warning" className="h-5 gap-1">
                    <Clock className="size-3" />
                    待验证
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                接收任务状态变更与截止时间提醒
              </p>
            </div>
          </div>

          {hasVerifiedEmail && !hasPendingEmail && !isEditingEmail && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!isAvailable || isBusy}
              onClick={() => {
                setEmail(settings?.email ?? "");
                setIsEditingEmail(true);
              }}
              className="h-8 shrink-0 text-xs"
            >
              更换
            </Button>
          )}
        </div>

        {hasVerifiedEmail && !hasPendingEmail && !isEditingEmail && (
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-muted/40 px-3 py-2 text-sm">
            <CheckCircle2 className="size-4 shrink-0 text-success" />
            <span className="font-mono text-xs">{settings?.email}</span>
          </div>
        )}

        {hasPendingEmail && (
          <div className="space-y-3 rounded-[var(--radius-md)] border border-warning/30 bg-warning/5 p-3">
            <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
              <span className="text-foreground/80">
                验证码已发送至{" "}
                <strong className="font-mono font-medium text-foreground">
                  {settings?.pendingEmail}
                </strong>
              </span>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  disabled={resendCountdown > 0 || isBusy || !isAvailable}
                  onClick={() =>
                    void handleRequestVerification(settings?.pendingEmail)
                  }
                  className="inline-flex items-center gap-1 text-primary hover:underline disabled:pointer-events-none disabled:text-muted-foreground"
                >
                  <RotateCw
                    className={`size-3 ${pendingAction === "send" ? "animate-spin" : ""}`}
                  />
                  {resendCountdown > 0
                    ? `${resendCountdown}s 后重发`
                    : "重新发送"}
                </button>
                <span className="text-border">|</span>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setIsEditingEmail(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  更换邮箱
                </button>
              </div>
            </div>

            <form
              onSubmit={handleConfirmVerification}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <Label htmlFor="verificationCode" className="sr-only">
                邮箱验证码
              </Label>
              <Input
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="输入 6 位验证码"
                disabled={isBusy}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={10}
                required
                className="h-9 flex-1 font-mono text-sm"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isBusy || !verificationCode.trim()}
                className="h-9 shrink-0"
              >
                {pendingAction === "confirm" ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    验证中
                  </>
                ) : (
                  "完成验证"
                )}
              </Button>
            </form>
          </div>
        )}

        {((!hasVerifiedEmail && !hasPendingEmail) || isEditingEmail) && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleRequestVerification();
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <div className="relative flex-1">
              <Label htmlFor="notificationEmailInput" className="sr-only">
                邮箱地址
              </Label>
              <Input
                id="notificationEmailInput"
                type="email"
                value={email}
                disabled={!isAvailable || isBusy}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="例如 student@example.edu.cn"
                autoComplete="email"
                required
                className="h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={!isAvailable || isBusy || !email.trim()}
                className="h-9 shrink-0"
              >
                {pendingAction === "send" ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    发送中
                  </>
                ) : (
                  "发送验证码"
                )}
              </Button>
              {isEditingEmail && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => {
                    setIsEditingEmail(false);
                    setEmail(settings?.email ?? "");
                  }}
                  className="h-9 shrink-0"
                >
                  取消
                </Button>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="h-px bg-border" />

      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-[var(--radius-md)] py-3 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 space-y-1">
              <span className="block text-sm font-semibold">邮件通知</span>
              <span className="block text-xs text-muted-foreground">
                {!settings
                  ? "设置读取失败，请刷新页面重试"
                  : !isAvailable
                    ? "服务暂不可用"
                    : !hasVerifiedEmail
                      ? "需先完成邮箱绑定与验证"
                      : settings.enabled
                        ? `已开启${deadlineReminderMinutes.length ? `（已设 ${deadlineReminderMinutes.length} 个临期提醒）` : "未设置临期提醒"}`
                        : "已关闭"}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader className="shrink-0 pt-[max(1rem,env(safe-area-inset-top))]">
            <div>
              <SheetTitle>邮件通知</SheetTitle>
              <SheetDescription>设置任务通知与临期提醒</SheetDescription>
            </div>
            <SheetClose asChild>
              <Button type="button" variant="ghost" size="icon" className="size-11 shrink-0" aria-label="关闭邮件通知抽屉">
                <X className="size-4" />
              </Button>
            </SheetClose>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 py-1">
                <div className="flex min-w-0 items-start gap-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="emailNotificationEnabled"
                      className="block cursor-pointer text-sm font-semibold"
                    >
                      邮件通知
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {!hasVerifiedEmail
                        ? "需先完成邮箱绑定与验证"
                        : "任务完成或临近截止时自动发送提醒"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="emailNotificationEnabled"
                  checked={settings?.enabled ?? false}
                  disabled={!hasVerifiedEmail || !isAvailable || isBusy}
                  onCheckedChange={(checked) => void handleEnabledChange(checked)}
                  className="shrink-0"
                />
              </div>
      
              <div className="flex items-center justify-between gap-4 py-1">
                <div className="flex min-w-0 items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">任务状态通知</p>
                    <p className="text-xs text-muted-foreground">
                      学习任务执行完毕、暂停或异常中断时发送
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Switch
                    checked={Boolean(
                      settings?.enabled && hasVerifiedEmail && isAvailable,
                    )}
                    disabled
                    aria-label="任务状态通知跟随总开关"
                    className="pointer-events-none"
                  />
                </div>
              </div>
            </div>

            <section className="space-y-4 border-t pt-5" aria-labelledby="deadline-reminders-title">
              <div className="space-y-1">
                <h3 id="deadline-reminders-title" className="text-sm font-semibold">临期未完成提醒</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  在作业、考试或课程结课前发送邮件提醒
                </p>
              </div>
              {settings?.enabled === false && hasVerifiedEmail && (
                <p className="text-xs text-muted-foreground">邮件通知已关闭，开启后按所选时间提醒</p>
              )}
              <div className="divide-y">
                {PRESET_REMINDERS.map(({ label, minutes }) => {
                  const isSelected = deadlineReminderMinutes.includes(minutes);
                  return (
                    <div key={minutes} className="flex min-h-12 items-center justify-between gap-4 py-3">
                      <Label htmlFor={`deadline-preset-${minutes}`} className="flex-1 cursor-pointer text-sm">
                        {label}
                      </Label>
                      <Switch
                        id={`deadline-preset-${minutes}`}
                        checked={isSelected}
                        disabled={!hasVerifiedEmail || !isAvailable || isBusy || (!isSelected && !canAddMoreReminders)}
                        onCheckedChange={(checked) => checked ? handleAddPreset(minutes) : handleRemoveDeadlineReminder(minutes)}
                        className="shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
              {deadlineReminderMinutes.some((minutes) => !PRESET_REMINDERS.some((preset) => preset.minutes === minutes)) && (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-xs text-muted-foreground">之前设置的时间</p>
                  {deadlineReminderMinutes.filter((minutes) => !PRESET_REMINDERS.some((preset) => preset.minutes === minutes)).map((minutes) => (
                    <div key={minutes} className="flex items-center justify-between gap-4 py-1">
                      <span className="text-sm">提前 {formatReminderTime(minutes)}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={!hasVerifiedEmail || !isAvailable || isBusy}
                        onClick={() => handleRemoveDeadlineReminder(minutes)}
                        aria-label={`移除提前 ${formatReminderTime(minutes)} 的提醒`}
                      >
                        移除
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
