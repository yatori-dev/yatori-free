import { useState } from 'react';
import { useTheme } from 'next-themes';
import { AlarmClock, Monitor, Moon, Palette, Settings, Sun, Zap } from 'lucide-react';
import { EmailNotificationSettings } from '@/components/EmailNotificationSettings';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BypassDailyStudyLimitConfirmDialog } from './BypassDailyStudyLimitConfirmDialog';

type SettingSwitchKey = 'bypassDailyStudyLimit' | 'showDeadlineBadges';

interface TaskSettingsPanelProps {
  bypassDailyStudyLimit: boolean;
  showDeadlineBadges: boolean;
  onUnauthorized: () => void;
  onSettingSwitch: (key: SettingSwitchKey, checked: boolean) => void;
}

export function TaskSettingsPanel({
  bypassDailyStudyLimit,
  showDeadlineBadges,
  onUnauthorized,
  onSettingSwitch,
}: TaskSettingsPanelProps) {
  const [bypassConfirmOpen, setBypassConfirmOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleBypassChange = (checked: boolean) => {
    if (checked) {
      setBypassConfirmOpen(true);
      return;
    }

    onSettingSwitch('bypassDailyStudyLimit', false);
  };

  return (
    <>
      <section className="w-full min-w-0 max-w-6xl" aria-label="设置">
        <div className="border-b border-border pb-4 lg:hidden">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Settings className="h-4 w-4 text-primary" />
            设置
          </h2>
        </div>
        <div className="pt-4 text-sm lg:pt-0">
          <div className="space-y-8">
            <section
              className="space-y-2"
              aria-labelledby="task-behavior-settings-heading"
            >
              <h2
                id="task-behavior-settings-heading"
                className="text-base font-semibold text-foreground"
              >
                任务行为
              </h2>

              <div className="flex items-center justify-between gap-4 border-b border-border py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Zap aria-hidden="true" className="size-4" />
                  </span>
                  <Label
                    htmlFor="bypassDailyStudyLimit"
                    className="block cursor-pointer text-sm font-semibold text-foreground"
                  >
                    暴力模式
                  </Label>
                </div>
                <Switch
                  id="bypassDailyStudyLimit"
                  checked={bypassDailyStudyLimit}
                  onCheckedChange={handleBypassChange}
                  className="theme-switch shrink-0"
                />
              </div>
            </section>

            <section
              className="space-y-2"
              aria-labelledby="display-settings-heading"
            >
              <h2
                id="display-settings-heading"
                className="text-base font-semibold text-foreground"
              >
                显示
              </h2>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Palette aria-hidden="true" className="size-4" />
                  </span>
                  <Label
                    htmlFor="theme-setting"
                    className="text-sm font-semibold text-foreground"
                  >
                    主题
                  </Label>
                </div>
                <div
                  id="theme-setting"
                  className="inline-flex max-w-full flex-wrap rounded-md bg-muted p-1"
                  role="group"
                  aria-label="选择主题"
                >
                  {[
                    { value: 'system', label: '跟随系统', Icon: Monitor },
                    { value: 'light', label: '浅色', Icon: Sun },
                    { value: 'dark', label: '深色', Icon: Moon },
                  ].map(({ value, label, Icon }) => {
                    const selected = (theme ?? 'system') === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={selected}
                        aria-label={label}
                        title={label}
                        onClick={() => setTheme(value)}
                        className={`flex h-8 items-center justify-center gap-1.5 rounded-sm px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-2.5 ${selected ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        <Icon aria-hidden="true" className="h-4 w-4" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-4 border-b border-border py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <AlarmClock aria-hidden="true" className="size-4" />
                  </span>
                  <Label
                    htmlFor="showDeadlineBadges"
                    className="block cursor-pointer text-sm font-semibold text-foreground"
                  >
                    临期作业/考试徽章提醒
                  </Label>
                </div>
                <Switch
                  id="showDeadlineBadges"
                  checked={showDeadlineBadges}
                  onCheckedChange={(checked: boolean) =>
                    onSettingSwitch('showDeadlineBadges', checked)
                  }
                  className="shrink-0"
                />
              </div>
            </section>

            <section
              className="space-y-2"
              aria-labelledby="notification-settings-heading"
            >
              <h2
                id="notification-settings-heading"
                className="text-base font-semibold text-foreground"
              >
                通知
              </h2>
              <EmailNotificationSettings onUnauthorized={onUnauthorized} />
            </section>
          </div>
        </div>
      </section>

      <BypassDailyStudyLimitConfirmDialog
        open={bypassConfirmOpen}
        onOpenChange={setBypassConfirmOpen}
        onConfirm={() => onSettingSwitch('bypassDailyStudyLimit', true)}
      />
    </>
  );
}
