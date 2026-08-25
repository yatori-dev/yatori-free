import { useState } from 'react';
import { EmailNotificationSettings } from '@/components/EmailNotificationSettings';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { BypassDailyStudyLimitConfirmDialog } from './BypassDailyStudyLimitConfirmDialog';

type SubmitMode = 0 | 1 | 2;
type SettingSwitchKey = 'hideEmptyTaskCourses' | 'bypassDailyStudyLimit' | 'doChapterTest' | 'doWork' | 'doExam';

interface AutoSubmitOptionProps {
  disabled: boolean;
  selected: boolean;
  label: string;
  onClick: () => void;
}

function AutoSubmitOption({ disabled, selected, label, onClick }: AutoSubmitOptionProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex min-h-11 items-center justify-between rounded-md border px-3 py-2 text-left shadow-sm transition-all duration-200 disabled:cursor-not-allowed sm:rounded-lg sm:px-4 sm:py-3',
        selected
          ? 'border-primary bg-primary-container/30 text-primary'
          : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/40',
      )}
    >
      <span className="text-sm font-medium transition-colors">{label}</span>
      <span className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
        selected ? 'border-primary bg-primary' : 'border-border bg-muted',
      )}>
        {selected && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
      </span>
    </button>
  );
}

interface AutoSubmitSettingsProps {
  enabled: boolean;
  value: SubmitMode;
  onChange: (value: SubmitMode) => void;
}

function AutoSubmitSettings({ enabled, value, onChange }: AutoSubmitSettingsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 pt-3 sm:gap-4 sm:pt-4">
      <AutoSubmitOption
        disabled={!enabled}
        selected={enabled && value === 1}
        label="自动提交"
        onClick={() => onChange(1)}
      />
      <AutoSubmitOption
        disabled={!enabled}
        selected={enabled && value === 0}
        label="仅保存不提交"
        onClick={() => onChange(0)}
      />
    </div>
  );
}

interface TaskBehaviorCardProps {
  id: 'doWork' | 'doExam';
  label: string;
  enabled: boolean;
  value: SubmitMode;
  onToggle: (checked: boolean) => void;
  onModeChange: (value: SubmitMode) => void;
}

function TaskBehaviorCard({ id, label, enabled, value, onToggle, onModeChange }: TaskBehaviorCardProps) {
  return (
    <Field className="rounded-md border border-border/50 bg-muted/25 p-3 sm:rounded-lg sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <FieldLabel htmlFor={id} className="cursor-pointer text-sm font-semibold text-foreground">
          {label}
        </FieldLabel>
        <Switch id={id} checked={enabled} onCheckedChange={onToggle} className="shrink-0" />
      </div>
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
          enabled ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
        aria-hidden={!enabled}
      >
        <div className="min-h-0 overflow-hidden">
          <AutoSubmitSettings enabled={enabled} value={value} onChange={onModeChange} />
        </div>
      </div>
    </Field>
  );
}

interface TaskSettingsPanelProps {
  hiddenEmptyTaskCourseCount: number;
  hideEmptyTaskCourses: boolean;
  bypassDailyStudyLimit: boolean;
  doChapterTest: boolean;
  doWork: boolean;
  workAutoSubmit: SubmitMode;
  doExam: boolean;
  examAutoSubmit: SubmitMode;
  onUnauthorized: () => void;
  onSettingSwitch: (key: SettingSwitchKey, checked: boolean) => void;
  onWorkAutoSubmitChange: (value: SubmitMode) => void;
  onExamAutoSubmitChange: (value: SubmitMode) => void;
}

export function TaskSettingsPanel({
  hiddenEmptyTaskCourseCount,
  hideEmptyTaskCourses,
  bypassDailyStudyLimit,
  doChapterTest,
  doWork,
  workAutoSubmit,
  doExam,
  examAutoSubmit,
  onUnauthorized,
  onSettingSwitch,
  onWorkAutoSubmitChange,
  onExamAutoSubmitChange,
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
        <CardTitle className="text-sm font-semibold sm:text-base">提交设置</CardTitle>
      </CardHeader>
      <CardContent className="p-3 text-sm sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          <section className="space-y-2" aria-labelledby="notification-settings-heading">
            <h2 id="notification-settings-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              通知
            </h2>
            <EmailNotificationSettings onUnauthorized={onUnauthorized} />
          </section>

          <section className="space-y-3 sm:space-y-4" aria-labelledby="task-behavior-settings-heading">
            <h2 id="task-behavior-settings-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              任务行为
            </h2>

            <FieldGroup className="gap-3 sm:gap-4">
            <Field orientation="horizontal" className="rounded-md border border-border/50 bg-muted/25 p-3 transition-all sm:rounded-lg sm:p-5">
              <FieldContent className="min-w-0 pr-3 sm:pr-4">
                <FieldLabel htmlFor="hideEmptyTaskCourses" className="cursor-pointer text-sm font-semibold text-foreground">
                  隐藏无任务点课程
                </FieldLabel>
                <div
                  className={cn(
                    'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
                    hiddenEmptyTaskCourseCount > 0 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                  aria-hidden={hiddenEmptyTaskCourseCount === 0}
                >
                  <div className="min-h-0 overflow-hidden">
                    <FieldDescription className="text-xs">
                      当前已隐藏 {hiddenEmptyTaskCourseCount} 门
                    </FieldDescription>
                  </div>
                </div>
              </FieldContent>
              <Switch
                id="hideEmptyTaskCourses"
                checked={hideEmptyTaskCourses}
                onCheckedChange={(checked) => onSettingSwitch('hideEmptyTaskCourses', checked)}
                className="shrink-0"
              />
            </Field>

            <Field orientation="horizontal" className="rounded-md border border-border/50 bg-muted/25 p-3 transition-all sm:rounded-lg sm:p-5">
              <FieldContent className="min-w-0 pr-3 sm:pr-4">
                <FieldLabel htmlFor="bypassDailyStudyLimit" className="cursor-pointer text-sm font-semibold text-foreground">
                  暴力模式
                </FieldLabel>
              </FieldContent>
              <Switch
                id="bypassDailyStudyLimit"
                checked={bypassDailyStudyLimit}
                onCheckedChange={handleBypassChange}
                className="shrink-0"
              />
            </Field>

            <Field orientation="horizontal" className="rounded-md border border-border/50 bg-muted/25 p-3 transition-all sm:rounded-lg sm:p-5">
              <FieldLabel htmlFor="doChapterTest" className="cursor-pointer text-sm font-semibold text-foreground">
                章节测试自动答题
              </FieldLabel>
              <Switch
                id="doChapterTest"
                checked={doChapterTest}
                onCheckedChange={(checked) => onSettingSwitch('doChapterTest', checked)}
                className="shrink-0"
              />
            </Field>
            </FieldGroup>

            <div className="grid grid-cols-1 gap-3 sm:gap-6 xl:grid-cols-2">
              <TaskBehaviorCard
                id="doWork"
                label="课程作业自动答题"
                enabled={doWork}
                value={workAutoSubmit}
                onToggle={(checked) => onSettingSwitch('doWork', checked)}
                onModeChange={onWorkAutoSubmitChange}
              />
              <TaskBehaviorCard
                id="doExam"
                label="考试自动答题"
                enabled={doExam}
                value={examAutoSubmit}
                onToggle={(checked) => onSettingSwitch('doExam', checked)}
                onModeChange={onExamAutoSubmitChange}
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
