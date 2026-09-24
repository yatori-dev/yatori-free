import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Settings, Sun } from 'lucide-react';
import { EmailNotificationSettings } from '@/components/EmailNotificationSettings';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BypassDailyStudyLimitConfirmDialog } from './BypassDailyStudyLimitConfirmDialog';

type SettingSwitchKey = 'bypassDailyStudyLimit' | 'doChapterTest';

interface TaskSettingsPanelProps {
  bypassDailyStudyLimit: boolean;
  doChapterTest: boolean;
  onUnauthorized: () => void;
  onSettingSwitch: (key: SettingSwitchKey, checked: boolean) => void;
}

export function TaskSettingsPanel({
  bypassDailyStudyLimit,
  doChapterTest,
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
      <Card className="rounded-none border-none bg-card py-0 shadow-none ring-0 sm:rounded-xl sm:py-4 sm:shadow-sm lg:py-0">
      <CardHeader className="rounded-none border-b border-border/50 px-3 py-2.5 sm:px-6 sm:py-4 lg:hidden">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold sm:text-base"><Settings className="h-4 w-4 text-primary" />设置</CardTitle>
      </CardHeader>
      <CardContent className="p-3 text-sm sm:p-6">
        <div className="space-y-5 sm:space-y-6">
          <section className="space-y-3 sm:space-y-4" aria-labelledby="task-behavior-settings-heading">
            <h2 id="task-behavior-settings-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              任务行为
            </h2>

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5 shadow-xs transition-[border-color] duration-200 hover:border-border sm:p-5">
              <div className="min-w-0 space-y-1 pr-3 sm:space-y-1.5 sm:pr-4">
                <Label htmlFor="bypassDailyStudyLimit" className="block cursor-pointer text-sm font-semibold text-foreground">
                  暴力模式
                </Label>
              </div>
              <Switch
                id="bypassDailyStudyLimit"
                checked={bypassDailyStudyLimit}
                onCheckedChange={handleBypassChange}
                className="google-mode-switch shrink-0"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5 shadow-xs transition-[border-color] duration-200 hover:border-border sm:p-5">
              <Label htmlFor="doChapterTest" className="block cursor-pointer text-sm font-semibold text-foreground">
                章节测试自动答题
              </Label>
              <Switch
                id="doChapterTest"
                checked={doChapterTest}
                onCheckedChange={(checked) => onSettingSwitch('doChapterTest', checked)}
                className="shrink-0"
              />
            </div>
          </section>

          <section className="space-y-3 sm:space-y-4" aria-labelledby="display-settings-heading">
            <h2 id="display-settings-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              显示
            </h2>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-3.5 shadow-xs transition-[border-color] duration-200 hover:border-border sm:p-5">
              <div className="min-w-0 space-y-1">
                <Label htmlFor="theme-setting" className="text-sm font-semibold text-foreground">主题</Label>
              </div>
              <div id="theme-setting" className="inline-flex shrink-0 rounded-lg border border-border/70 bg-background/70 p-1 shadow-xs" role="group" aria-label="选择主题">
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
                      className={`flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors sm:px-2.5 ${selected ? 'bg-primary text-primary-foreground shadow-xs' : 'hover:bg-muted hover:text-foreground'}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="space-y-2" aria-labelledby="notification-settings-heading">
            <h2 id="notification-settings-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              通知
            </h2>
            <EmailNotificationSettings onUnauthorized={onUnauthorized} />
          </section>
        </div>
      </CardContent>
      </Card>

      <BypassDailyStudyLimitConfirmDialog
        open={bypassConfirmOpen}
        onOpenChange={setBypassConfirmOpen}
        onConfirm={() => onSettingSwitch('bypassDailyStudyLimit', true)}
      />
    </>
  );
}


