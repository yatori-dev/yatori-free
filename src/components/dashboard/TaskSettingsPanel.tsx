import { useState } from 'react';
import { useTheme } from 'next-themes';
import {
  AlarmClock,
  BellRing,
  Monitor,
  Moon,
  Palette,
  Sun,
  Zap,
} from 'lucide-react';
import { EmailNotificationSettings } from '@/components/EmailNotificationSettings';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { BypassDailyStudyLimitConfirmDialog } from './BypassDailyStudyLimitConfirmDialog';

type SettingSwitchKey = 'bypassDailyStudyLimit' | 'showDeadlineBadges';

interface TaskSettingsPanelProps {
  bypassDailyStudyLimit: boolean;
  showDeadlineBadges: boolean;
  onUnauthorized: () => void;
  onSettingSwitch: (key: SettingSwitchKey, checked: boolean) => void;
}

const settingSections = [
  { value: 'behavior', label: '任务行为', Icon: Zap },
  { value: 'appearance', label: '显示', Icon: Palette },
  { value: 'notifications', label: '通知', Icon: BellRing },
] as const;

export function TaskSettingsPanel({
  bypassDailyStudyLimit,
  showDeadlineBadges,
  onUnauthorized,
  onSettingSwitch,
}: TaskSettingsPanelProps) {
  const [bypassConfirmOpen, setBypassConfirmOpen] = useState(false);
  const [activeSettingSection, setActiveSettingSection] = useState('behavior');
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
        <header className="mb-6 border-b border-border pb-5">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">设置</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            调整 Yatori 服务的设置项
          </p>
        </header>

        <Tabs
          value={activeSettingSection}
          onValueChange={setActiveSettingSection}
          orientation="vertical"
          className="min-w-0 flex-col gap-6 md:flex-row md:gap-10"
        >
          <div className="md:hidden">
            <Select
              value={activeSettingSection}
              onValueChange={setActiveSettingSection}
            >
              <SelectTrigger aria-label="设置分类" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {settingSections.map(({ value, label, Icon }) => (
                  <SelectItem key={value} value={value}>
                    <Icon aria-hidden="true" className="size-4" />
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TabsList
            aria-label="设置分类"
            className="hidden w-full min-w-0 justify-start gap-1 overflow-x-auto border-b border-border bg-transparent pb-2 md:sticky md:top-0 md:flex md:h-fit md:w-52 md:items-stretch md:overflow-visible md:border-b-0 md:border-r md:pb-0 md:pr-4"
          >
            {settingSections.map(({ value, label, Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="w-auto flex-none justify-start gap-3 rounded-md px-3 py-2.5 text-sm data-active:bg-muted data-active:font-medium data-active:shadow-none md:w-full"
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent
            value="behavior"
            forceMount
            className="min-w-0 data-[state=inactive]:hidden"
          >
            <div className="space-y-4">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-semibold text-foreground">任务行为</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  设置章节任务点、作业/考试处理行为选项
                </p>
              </div>
              <Card
                size="sm"
                className="flex-row items-center justify-between gap-4 p-4 shadow-none"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Zap
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
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
              </Card>
            </div>
          </TabsContent>

          <TabsContent
            value="appearance"
            forceMount
            className="min-w-0 data-[state=inactive]:hidden"
          >
            <div className="space-y-4">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-semibold text-foreground">显示</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  设置界面主题或其他显示选项
                </p>
              </div>

              <Card
                size="sm"
                className="flex-row flex-wrap items-center justify-between gap-4 p-4 shadow-none"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Palette
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <span className="text-sm font-semibold text-foreground">
                    主题
                  </span>
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
                        <Icon aria-hidden="true" className="size-4" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card
                size="sm"
                className="flex-row items-center justify-between gap-4 p-4 shadow-none"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <AlarmClock
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
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
              </Card>
            </div>
          </TabsContent>

          <TabsContent
            value="notifications"
            forceMount
            className="min-w-0 data-[state=inactive]:hidden"
          >
            <div className="space-y-4">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-semibold text-foreground">通知</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  管理邮件提醒
                </p>
              </div>
              <EmailNotificationSettings onUnauthorized={onUnauthorized} />
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <BypassDailyStudyLimitConfirmDialog
        open={bypassConfirmOpen}
        onOpenChange={setBypassConfirmOpen}
        onConfirm={() => onSettingSwitch('bypassDailyStudyLimit', true)}
      />
    </>
  );
}
