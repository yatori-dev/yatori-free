import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  AlarmClock,
  BellRing,
  Gauge,
  Monitor,
  Moon,
  Palette,
  Send,
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
import { changeView } from '@/lib/motion';

export type SettingSwitchKey =
  | 'bypassDailyStudyLimit'
  | 'showDeadlineBadges'
  | 'autoSubmitWorksNearDeadline'
  | 'accelerateBeforeCourseEnd';

interface TaskSettingsPanelProps {
  bypassDailyStudyLimit: boolean;
  showDeadlineBadges: boolean;
  autoSubmitWorksNearDeadline: boolean;
  accelerateBeforeCourseEnd: boolean;
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
  autoSubmitWorksNearDeadline,
  accelerateBeforeCourseEnd,
  onUnauthorized,
  onSettingSwitch,
}: TaskSettingsPanelProps) {
  const [bypassConfirmOpen, setBypassConfirmOpen] = useState(false);
  const [activeSettingSection, setActiveSettingSection] = useState('behavior');
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  );
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleChange = () => setIsDesktop(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const changeSection = (value: string) => {
    if (value !== activeSettingSection) {
      changeView(() => setActiveSettingSection(value), 'settings');
    }
  };

  const handleBypassChange = (checked: boolean) => {
    if (checked) {
      setBypassConfirmOpen(true);
      return;
    }

    onSettingSwitch('bypassDailyStudyLimit', false);
  };

  return (
    <>
      <section className="settings-view flex w-full min-w-0 flex-1 md:min-h-0" aria-label="设置分类与内容">
        <Tabs
          value={activeSettingSection}
          onValueChange={changeSection}
          orientation={isDesktop ? 'vertical' : 'horizontal'}
          className="min-w-0 flex-1 flex-col gap-0 md:min-h-0 md:flex-row"
        >
          <TabsList
            aria-label="设置分类"
            className="hidden shrink-0 items-stretch justify-start gap-1 self-stretch rounded-none border-r bg-muted/30 p-[var(--space-3)] text-sm font-medium text-muted-foreground md:flex md:w-44 md:flex-col group-data-vertical/tabs:h-auto"
          >
            {settingSections.map(({ value, label, Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="relative h-11 w-full flex-none justify-start gap-2 rounded-[var(--radius-md)] border-0 px-[var(--space-3)] text-sm font-medium text-muted-foreground transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:text-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-active:text-foreground"
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent
            value="behavior"
            forceMount
            className="min-w-0 shrink-0 px-[var(--space-4)] py-[var(--space-5)] [overflow-wrap:anywhere] sm:px-[var(--space-6)] md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-contain md:py-[var(--space-6)] md:data-[state=inactive]:hidden"
          >
            <div className="space-y-[var(--space-5)]">
              <div className="border-b pb-[var(--space-3)]">
                <h2 className="text-lg font-medium">任务行为</h2>
              </div>
              <div className="flex items-start justify-between gap-[var(--space-4)]">
                <div className="flex min-w-0 flex-1 items-start gap-[var(--space-3)]">
                  <Zap
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <div className="min-w-0 flex-1">
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
              <div className="flex items-start justify-between gap-[var(--space-4)]">
                <div className="flex min-w-0 flex-1 items-start gap-[var(--space-3)]">
                  <Send aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="autoSubmitWorksNearDeadline" className="block cursor-pointer text-sm font-semibold text-foreground">
                      作业临近截止自动提交
                    </Label>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">截止前 5 分钟仍未完成时自动提交</p>
                  </div>
                </div>
                <Switch
                  id="autoSubmitWorksNearDeadline"
                  checked={autoSubmitWorksNearDeadline}
                  onCheckedChange={(checked) => onSettingSwitch('autoSubmitWorksNearDeadline', checked)}
                  className="mt-0.5 shrink-0"
                />
              </div>
              <div className="flex items-start justify-between gap-[var(--space-4)]">
                <div className="flex min-w-0 flex-1 items-start gap-[var(--space-3)]">
                  <Gauge aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="accelerateBeforeCourseEnd" className="block cursor-pointer text-sm font-semibold text-foreground">
                      结课前自动完成
                    </Label>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">结课前 1 小时自动处理未完成任务点</p>
                  </div>
                </div>
                <Switch
                  id="accelerateBeforeCourseEnd"
                  checked={accelerateBeforeCourseEnd}
                  onCheckedChange={(checked) => onSettingSwitch('accelerateBeforeCourseEnd', checked)}
                  className="mt-0.5 shrink-0"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="appearance"
            forceMount
            className="min-w-0 shrink-0 px-[var(--space-4)] py-[var(--space-5)] [overflow-wrap:anywhere] sm:px-[var(--space-6)] md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-contain md:py-[var(--space-6)] md:data-[state=inactive]:hidden"
          >
            <div className="space-y-[var(--space-5)]">
              <div className="border-b pb-[var(--space-3)]">
                <h2 className="text-lg font-medium">显示</h2>
              </div>

              <div className="flex items-center justify-between gap-[var(--space-4)]">
                <div className="flex min-w-0 flex-1 items-start gap-[var(--space-3)]">
                  <Palette
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="theme-setting" className="text-sm font-semibold text-foreground">主题</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      选择浅色、深色或跟随系统
                    </p>
                  </div>
                </div>
                <Select value={theme ?? 'system'} onValueChange={setTheme}>
                  <SelectTrigger id="theme-setting" className="w-32 shrink-0 sm:w-40 data-[size=default]:h-11">
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

              <div className="flex items-start justify-between gap-[var(--space-4)]">
                <div className="flex min-w-0 flex-1 items-start gap-[var(--space-3)]">
                  <AlarmClock
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <div className="min-w-0 flex-1">
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
            className="min-w-0 shrink-0 px-[var(--space-4)] py-[var(--space-5)] [overflow-wrap:anywhere] sm:px-[var(--space-6)] md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-contain md:py-[var(--space-6)] md:data-[state=inactive]:hidden"
          >
            <div className="space-y-[var(--space-5)]">
              <div className="border-b pb-[var(--space-3)]">
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
