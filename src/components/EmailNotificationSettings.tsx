import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Plus,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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

type TimeUnit = "minute" | "hour" | "day";

const EMAIL_NOTIFICATION_CACHE_KEY = "email-notification-settings";
const MAX_DEADLINE_REMINDERS = 5;
const MAX_DEADLINE_MINUTES = 43_200;

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
  const [customAmount, setCustomAmount] = useState("1");
  const [customUnit, setCustomUnit] = useState<TimeUnit>("hour");
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

  const handleAddCustomReminder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(customAmount);
    if (!Number.isInteger(amount) || amount <= 0) {
      toast.error("请输入正整数");
      return;
    }

    const multiplier =
      customUnit === "day" ? 1440 : customUnit === "hour" ? 60 : 1;
    const minutes = amount * multiplier;

    const current = settings?.deadlineReminderMinutes ?? [];
    if (current.length >= MAX_DEADLINE_REMINDERS) {
      toast.error(`最多设置 ${MAX_DEADLINE_REMINDERS} 个提醒时间`);
      return;
    }
    if (minutes > MAX_DEADLINE_MINUTES) {
      toast.error("提醒时间不能超过 30 天");
      return;
    }
    if (current.includes(minutes)) {
      toast.error("该提醒时间已存在");
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
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="space-y-0.5">
            <p className="font-medium text-destructive">邮件通知服务暂不可用</p>
            <p className="text-xs text-destructive/80">
              后端通知服务尚未就绪，目前无法发送邮件。
            </p>
          </div>
        </div>
      )}

      {/* 邮箱绑定 */}
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
                  <Badge variant="outline" className="h-5 gap-1 border-warning/50 bg-warning/10 text-warning">
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
          <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
            <CheckCircle2 className="size-4 shrink-0 text-success" />
            <span className="font-mono text-xs">{settings?.email}</span>
          </div>
        )}

        {hasPendingEmail && (
          <div className="space-y-3 rounded-md border border-warning/30 bg-warning/5 p-3">
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

      {/* 通知开关 */}
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

      <div className="h-px bg-border" />

      {/* 临期提醒 */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">临期未完成提醒</h3>
                <Badge variant="secondary" className="h-5 text-xs font-normal">
                  {deadlineReminderMinutes.length} / {MAX_DEADLINE_REMINDERS}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                在作业、考试或课程结课前指定时间提醒
              </p>
            </div>
          </div>
          {settings?.enabled === false && hasVerifiedEmail && (
            <span className="shrink-0 text-xs text-warning">
              邮件总开关已关闭
            </span>
          )}
        </div>

        {deadlineReminderMinutes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-8 text-center">
            <Clock className="mb-2 size-5 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">暂未设置临期提醒</p>
            <p className="mt-0.5 text-xs text-muted-foreground/70">
              可从下方选择预设或自定义时间
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {deadlineReminderMinutes.map((minutes) => (
              <div
                key={minutes}
                className="inline-flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5 text-xs transition-colors hover:bg-muted/60"
              >
                <span className="font-medium">
                  提前 {formatReminderTime(minutes)}
                </span>
                <button
                  type="button"
                  aria-label={`删除提前 ${formatReminderTime(minutes)} 提醒`}
                  disabled={!hasVerifiedEmail || !isAvailable || isBusy}
                  onClick={() => handleRemoveDeadlineReminder(minutes)}
                  className="inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>快捷预设</span>
            {!canAddMoreReminders && (
              <span className="text-destructive">已达上限</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_REMINDERS.map(({ label, minutes }) => {
              const isAdded = deadlineReminderMinutes.includes(minutes);
              return (
                <Button
                  key={minutes}
                  type="button"
                  variant={isAdded ? "secondary" : "outline"}
                  size="sm"
                  disabled={
                    isAdded ||
                    !canAddMoreReminders ||
                    !hasVerifiedEmail ||
                    !isAvailable ||
                    isBusy
                  }
                  onClick={() => handleAddPreset(minutes)}
                  className="h-7 px-2.5 text-xs"
                >
                  {isAdded && <Check className="mr-1 size-3" />}
                  {label}
                </Button>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={handleAddCustomReminder}
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <div className="flex flex-1 items-center gap-2">
            <span className="shrink-0 text-xs text-muted-foreground">
              自定义：
            </span>
            <Label htmlFor="customReminderAmount" className="sr-only">
              自定义提前数值
            </Label>
            <Input
              id="customReminderAmount"
              type="number"
              min={1}
              step={1}
              value={customAmount}
              disabled={
                !canAddMoreReminders ||
                !hasVerifiedEmail ||
                !isAvailable ||
                isBusy
              }
              onChange={(e) => setCustomAmount(e.target.value)}
              className="h-9 w-20 font-mono text-sm"
            />
            <Label htmlFor="customReminderUnit" className="sr-only">
              时间单位
            </Label>
            <Select
              value={customUnit}
              onValueChange={(val) => setCustomUnit(val as TimeUnit)}
              disabled={
                !canAddMoreReminders ||
                !hasVerifiedEmail ||
                !isAvailable ||
                isBusy
              }
            >
              <SelectTrigger id="customReminderUnit" className="h-9 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minute">分钟</SelectItem>
                <SelectItem value="hour">小时</SelectItem>
                <SelectItem value="day">天</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={
              !canAddMoreReminders ||
              !hasVerifiedEmail ||
              !isAvailable ||
              isBusy ||
              !customAmount.trim() ||
              Number(customAmount) <= 0
            }
            className="h-9 shrink-0 gap-1.5 text-xs"
          >
            <Plus className="size-3.5" />
            添加
          </Button>
        </form>
      </div>
    </div>
  );
}
