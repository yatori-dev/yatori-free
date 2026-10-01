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
      <section className="flex min-h-0 w-full min-w-0 flex-1" aria-label="设置分类与内容">
        <Tabs
          value={activeSettingSection}
          onValueChange={setActiveSettingSection}
          orientation="vertical"
          className="min-h-0 min-w-0 flex-1 flex-col gap-0 md:flex-row"
        >
          <div className="shrink-0 border-b px-4 py-3 md:hidden">
            <Select
              value={activeSettingSection}
              onValueChange={setActiveSettingSection}
            >
              <SelectTrigger aria-label="设置分类" className="w-full data-[size=default]:h-11">
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
            className="hidden w-44 shrink-0 items-stretch justify-start gap-1 self-stretch overflow-y-auto rounded-none border-r bg-muted/30 p-3 group-data-vertical/tabs:h-auto md:flex"
          >
            {settingSections.map(({ value, label, Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="h-11 w-full flex-none justify-start gap-2 rounded-md px-3 text-sm font-medium hover:bg-muted data-active:bg-muted data-active:text-foreground data-active:shadow-none"
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent
            value="behavior"
            forceMount
            className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 [overflow-wrap:anywhere] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:p-6 data-[state=inactive]:hidden"
          >
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-lg font-medium">任务行为</h2>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <Zap
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <Label
                      htmlFor="bypassDailyStudyLimit"
                      className="block cursor-pointer text-sm font-semibold text-foreground"
                    >
                      暴力模式
                    </Label>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      50 并发处理任务并无视每日学时限制
                    </p>
                  </div>
                </div>
                <Switch
                  id="bypassDailyStudyLimit"
                  checked={bypassDailyStudyLimit}
                  onCheckedChange={handleBypassChange}
                  className="theme-switch mt-0.5 shrink-0"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="appearance"
            forceMount
            className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 [overflow-wrap:anywhere] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:p-6 data-[state=inactive]:hidden"
          >
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-lg font-medium">显示</h2>
              </div>

              <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
                <div className="flex min-w-0 items-start gap-3">
                  <Palette
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <Label htmlFor="theme-setting" className="text-sm font-semibold text-foreground">主题</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      选择浅色、深色或跟随系统
                    </p>
                  </div>
                </div>
                <Select value={theme ?? 'system'} onValueChange={setTheme}>
                  <SelectTrigger id="theme-setting" className="w-40 shrink-0 data-[size=default]:h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { value: 'system', label: '跟随系统', Icon: Monitor },
                      { value: 'light', label: '浅色', Icon: Sun },
                      { value: 'dark', label: '深色', Icon: Moon },
                    ].map(({ value, label, Icon }) => (
                      <SelectItem key={value} value={value}>
                        <Icon aria-hidden="true" className="size-4" />
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <AlarmClock
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <Label
                      htmlFor="showDeadlineBadges"
                      className="block cursor-pointer text-sm font-semibold text-foreground"
                    >
                      临期作业/考试徽章提醒
                    </Label>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      在课程列表中显示即将截止的任务
                    </p>
                  </div>
                </div>
                <Switch
                  id="showDeadlineBadges"
                  checked={showDeadlineBadges}
                  onCheckedChange={(checked: boolean) =>
                    onSettingSwitch('showDeadlineBadges', checked)
                  }
                  className="mt-0.5 shrink-0"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="notifications"
            forceMount
            className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 [overflow-wrap:anywhere] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:p-6 data-[state=inactive]:hidden"
          >
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-lg font-medium">通知</h2>
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
