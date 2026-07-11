import { useState } from 'react';
import { Minus, Plus, SlidersHorizontal } from 'lucide-react';
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
import type { Course, StudyIncrement } from '@/lib/api';

interface StudyIncrementSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  values: Record<string, StudyIncrement>;
  onSave: (classId: string, value: StudyIncrement) => void;
}

interface StepperFieldProps {
  id: string;
  label: string;
  value: string;
  maximum: number;
  step: number;
  presets: number[];
  unit: string;
  onChange: (value: string) => void;
}

function StepperField({ id, label, value, maximum, step, presets, unit, onChange }: StepperFieldProps) {
  const setValue = (nextValue: number) => {
    onChange(String(Math.min(maximum, Math.max(0, Math.trunc(nextValue)))));
  };
  const numericValue = value === '' ? 0 : Number(value);

  return (
    <div className="space-y-2.5 rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        <span className="text-xs tabular-nums text-muted-foreground">最多 {maximum}{unit}</span>
      </div>
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10"
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
            onChange={(event) => {
              const nextValue = event.target.value;
              if (nextValue === '') {
                onChange('');
                return;
              }
              setValue(Number(nextValue));
            }}
            className="h-10 pr-11 text-center font-semibold tabular-nums"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {unit}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10"
          disabled={numericValue === maximum}
          onClick={() => setValue(numericValue + step)}
          aria-label={`${label}增加 ${step}${unit}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
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
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2.5 text-xs" onClick={() => onChange('')}>
            清零
          </Button>
        )}
      </div>
    </div>
  );
}

export function StudyIncrementSettings({
  open,
  onOpenChange,
  course,
  values,
  onSave,
}: StudyIncrementSettingsProps) {
  if (!open || !course) return null;

  return (
    <StudyIncrementDialog
      key={course.key}
      course={course}
      initialValue={values[course.key] ?? { visitCount: 0, studyMinutes: 0 }}
      onOpenChange={onOpenChange}
      onSave={onSave}
    />
  );
}

interface StudyIncrementDialogProps {
  course: Course;
  initialValue: StudyIncrement;
  onOpenChange: (open: boolean) => void;
  onSave: (classId: string, value: StudyIncrement) => void;
}

function StudyIncrementDialog({ course, initialValue, onOpenChange, onSave }: StudyIncrementDialogProps) {
  const [draft, setDraft] = useState({
    visitCount: initialValue.visitCount === 0 ? '' : String(initialValue.visitCount),
    studyMinutes: initialValue.studyMinutes === 0 ? '' : String(initialValue.studyMinutes),
  });

  const updateDraft = (field: keyof StudyIncrement, value: string) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
  };

  const save = () => {
    onSave(course.key, {
      visitCount: draft.visitCount === '' ? 0 : Number(draft.visitCount),
      studyMinutes: draft.studyMinutes === '' ? 0 : Number(draft.studyMinutes),
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

        <div className="grid grid-cols-1 gap-3 overflow-y-auto px-4 py-4 sm:px-5">
          <StepperField
            id={`study-visit-${course.key}`}
            label="学习次数"
            value={draft.visitCount}
            maximum={400}
            step={1}
            presets={[10, 20, 50, 100]}
            unit="次"
            onChange={(value) => updateDraft('visitCount', value)}
          />
          <StepperField
            id={`study-minutes-${course.key}`}
            label="学习时长"
            value={draft.studyMinutes}
            maximum={4000}
            step={10}
            presets={[30, 60, 120, 300]}
            unit="分钟"
            onChange={(value) => updateDraft('studyMinutes', value)}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border/50 bg-muted/30 p-3 sm:px-5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={save}>保存</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
