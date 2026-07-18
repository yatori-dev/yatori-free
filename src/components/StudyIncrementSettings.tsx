import { useState } from 'react';
import { AlertCircle, BookOpen, Clock3, Eye, LoaderCircle, Minus, Plus, SlidersHorizontal } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { Course, StudyIncrement, StudyStats } from '@/lib/api';

interface StudyIncrementSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  hasReadTaskPoints: boolean;
  studyStats?: StudyStats;
  statsLoaded: boolean;
  loadingStats: boolean;
  values: Record<string, StudyIncrement>;
  onSave: (classId: string, value: StudyIncrement) => void;
}

interface StepperFieldProps {
  id: string;
  icon: typeof Eye;
  label: string;
  value: string;
  currentValue?: number;
  maximum: number;
  step: number;
  presets: number[];
  unit: string;
  onChange: (value: string) => void;
}

function StepperField({
  id,
  icon: Icon,
  label,
  value,
  currentValue,
  maximum,
  step,
  presets,
  unit,
  onChange,
}: StepperFieldProps) {
  const setValue = (nextValue: number) => {
    onChange(String(Math.min(maximum, Math.max(0, Math.trunc(nextValue)))));
  };
  const numericValue = value === '' ? 0 : Number(value);
  const updateValue = (nextValue: string) => {
    if (nextValue === '') {
      onChange('');
      return;
    }

    const parsedValue = Number(nextValue);
    if (Number.isFinite(parsedValue)) {
      setValue(parsedValue);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-border/70 bg-card p-3 shadow-xs sm:p-4" aria-labelledby={`${id}-label`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <Label id={`${id}-label`} htmlFor={id} className="text-sm font-semibold text-foreground">
              {label}
            </Label>
            <p id={`${id}-current`} className="mt-1 flex items-baseline gap-1.5 text-sm font-medium text-foreground">
              <span className="text-muted-foreground">当前累计</span>
              <span className="text-base font-semibold tabular-nums text-primary">
                {currentValue ?? '--'}
                {currentValue !== undefined && <span className="ml-0.5 text-sm font-medium">{unit}</span>}
              </span>
            </p>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 font-normal tabular-nums text-muted-foreground">
          上限 {maximum}{unit}
        </Badge>
      </div>
      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11"
          disabled={numericValue === 0}
          onClick={() => setValue(numericValue - step)}
          aria-label={`${label}减少 ${step}${unit}`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="relative">
          <Input
            id={id}
            type="number"
            inputMode="numeric"
            min={0}
            max={maximum}
            step={step}
            value={value}
            onChange={(event) => updateValue(event.target.value)}
            className="h-11 pr-12 text-center text-base font-semibold tabular-nums"
            aria-describedby={`${id}-current`}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {unit}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11"
          disabled={numericValue === maximum}
          onClick={() => setValue(numericValue + step)}
          aria-label={`${label}增加 ${step}${unit}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-muted-foreground">快捷增加</span>
        {presets.map((preset) => (
          <Button
            key={preset}
            type="button"
            variant={numericValue === preset ? 'secondary' : 'outline'}
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => setValue(preset)}
          >
            {preset}{unit}
          </Button>
        ))}
        {numericValue > 0 && (
          <Button type="button" variant="ghost" size="sm" className="ml-auto h-7 px-2 text-xs" onClick={() => onChange('')}>
            清零
          </Button>
        )}
      </div>
    </section>
  );
}

export function StudyIncrementSettings({
  open,
  onOpenChange,
  course,
  hasReadTaskPoints,
  studyStats,
  statsLoaded,
  loadingStats,
  values,
  onSave,
}: StudyIncrementSettingsProps) {
  if (!open || !course) return null;

  return (
    <StudyIncrementDialog
      key={course.key}
      course={course}
      hasReadTaskPoints={hasReadTaskPoints}
      initialValue={values[course.key] ?? { visitCount: 0, videoStudyMinutes: 0, readMinutes: 0 }}
      studyStats={studyStats}
      statsLoaded={statsLoaded}
      loadingStats={loadingStats}
      onOpenChange={onOpenChange}
      onSave={onSave}
    />
  );
}

interface StudyIncrementDialogProps {
  course: Course;
  hasReadTaskPoints: boolean;
  initialValue: StudyIncrement;
  studyStats?: StudyStats;
  statsLoaded: boolean;
  loadingStats: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (classId: string, value: StudyIncrement) => void;
}

function StudyIncrementDialog({
  course,
  hasReadTaskPoints,
  initialValue,
  studyStats,
  statsLoaded,
  loadingStats,
  onOpenChange,
  onSave,
}: StudyIncrementDialogProps) {
  const courseDetailsReady = statsLoaded;
  const courseDetailsLoading = !courseDetailsReady && loadingStats;
  const initialVisitCount = initialValue.visitCount ?? 0;
  const initialVideoStudyMinutes = initialValue.videoStudyMinutes ?? 0;
  const initialReadMinutes = initialValue.readMinutes ?? 0;
  const [draft, setDraft] = useState({
    visitCount: initialVisitCount === 0 ? '' : String(initialVisitCount),
    videoStudyMinutes: initialVideoStudyMinutes === 0 ? '' : String(initialVideoStudyMinutes),
    readMinutes: initialReadMinutes === 0 ? '' : String(initialReadMinutes),
  });

  const updateDraft = (field: keyof StudyIncrement, value: string) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
  };

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(course.key, {
      visitCount: draft.visitCount === '' ? 0 : Number(draft.visitCount),
      videoStudyMinutes: draft.videoStudyMinutes === '' ? 0 : Number(draft.videoStudyMinutes),
      readMinutes: hasReadTaskPoints && draft.readMinutes !== '' ? Number(draft.readMinutes) : 0,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border/50 px-4 py-4 pr-12 sm:px-5">
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            学习目标
          </DialogTitle>
          <DialogDescription className="truncate" title={course.courseName}>
            {course.courseName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={save} className="contents">
          <div className="space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
            {!courseDetailsReady ? (
              <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-center">
                {courseDetailsLoading ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-sm font-medium text-foreground">正在读取课程任务</p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">课程任务读取失败</p>
                  </>
                )}
              </div>
            ) : (
              <>
                {!studyStats?.available && (
                  <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground" role="status">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{studyStats?.message || '当前学习数据不可用'}</span>
                  </div>
                )}

                <h3 className="text-sm font-semibold text-foreground">本次增加</h3>

                <div className="space-y-2.5">
                  <StepperField
                    id={`study-visit-${course.key}`}
                    icon={Eye}
                    label="学习次数"
                    value={draft.visitCount}
                    currentValue={studyStats?.available ? studyStats.visitCount : undefined}
                    maximum={400}
                    step={1}
                    presets={[10, 20, 50, 100]}
                    unit="次"
                    onChange={(value) => updateDraft('visitCount', value)}
                  />
                  <StepperField
                    id={`study-video-minutes-${course.key}`}
                    icon={Clock3}
                    label="视频观看时长"
                    value={draft.videoStudyMinutes}
                    currentValue={studyStats?.available ? studyStats.videoStudyMinutes : undefined}
                    maximum={4000}
                    step={10}
                    presets={[30, 60, 120, 300]}
                    unit="分钟"
                    onChange={(value) => updateDraft('videoStudyMinutes', value)}
                  />
                  {hasReadTaskPoints && (
                    <StepperField
                      id={`study-read-${course.key}`}
                      icon={BookOpen}
                      label="阅读时长"
                      value={draft.readMinutes}
                      currentValue={studyStats?.available ? studyStats.readMinutes : undefined}
                      maximum={4000}
                      step={10}
                      presets={[30, 60, 120, 300]}
                      unit="分钟"
                      onChange={(value) => updateDraft('readMinutes', value)}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-border/50 bg-muted/30 p-3 sm:px-5">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button type="submit" disabled={!courseDetailsReady}>保存目标</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
