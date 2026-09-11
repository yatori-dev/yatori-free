import { useState } from 'react';
import { EmailNotificationSettings } from '@/components/EmailNotificationSettings';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BypassDailyStudyLimitConfirmDialog } from './BypassDailyStudyLimitConfirmDialog';

type SettingSwitchKey = 'hideEmptyTaskCourses' | 'bypassDailyStudyLimit' | 'doChapterTest';

interface TaskSettingsPanelProps {
  hiddenEmptyTaskCourseCount: number;
  hideEmptyTaskCourses: boolean;
  bypassDailyStudyLimit: boolean;
  doChapterTest: boolean;
  onUnauthorized: () => void;
  onSettingSwitch: (key: SettingSwitchKey, checked: boolean) => void;
}

export function TaskSettingsPanel({
  hiddenEmptyTaskCourseCount,
  hideEmptyTaskCourses,
  bypassDailyStudyLimit,
  doChapterTest,
  onUnauthorized,
  onSettingSwitch,
}: TaskSettingsPanelProps) {
  const [bypassConfirmOpen, setBypassConfirmOpen] = useState(false);

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
        <CardTitle className="text-sm font-semibold sm:text-base">设置</CardTitle>
      </CardHeader>
      <CardContent className="p-3 text-sm sm:p-6">
        <div className="space-y-5 sm:space-y-6">
          <section className="space-y-2" aria-labelledby="notification-settings-heading">
            <h2 id="notification-settings-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              通知
            </h2>
            <EmailNotificationSettings onUnauthorized={onUnauthorized} />
          </section>

          <section className="space-y-3 sm:space-y-4" aria-labelledby="display-settings-heading">
            <h2 id="display-settings-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              显示
            </h2>
            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5 shadow-xs transition-all duration-200 hover:border-border sm:p-5">
                <div className="min-w-0 space-y-1 pr-3 sm:space-y-1.5 sm:pr-4">
                  <Label htmlFor="hideEmptyTaskCourses" className="block cursor-pointer text-sm font-semibold text-foreground">
                    隐藏无任务点课程
                  </Label>
                  <div
                    className={cn(
                      'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
                      hiddenEmptyTaskCourseCount > 0 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                    )}
                    aria-hidden={hiddenEmptyTaskCourseCount === 0}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <p className="text-xs leading-relaxed text-muted-foreground">当前已隐藏 {hiddenEmptyTaskCourseCount} 门</p>
                    </div>
                  </div>
                </div>
                <Switch id="hideEmptyTaskCourses" checked={hideEmptyTaskCourses} onCheckedChange={(checked) => onSettingSwitch('hideEmptyTaskCourses', checked)} className="shrink-0" />
              </div>
            </div>
          </section>

          <section className="space-y-3 sm:space-y-4" aria-labelledby="task-behavior-settings-heading">
            <h2 id="task-behavior-settings-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              任务行为
            </h2>

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5 shadow-xs transition-all duration-200 hover:border-border sm:p-5">
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

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5 shadow-xs transition-all duration-200 hover:border-border sm:p-5">
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


