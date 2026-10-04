import { useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Clock3,
  Eye,
  LoaderCircle,
  Minus,
  Plus,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import type { Course, StudyIncrement, StudyStats } from "@/lib/api";

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
  const numericValue = value === "" ? 0 : Number(value);
  const updateValue = (nextValue: string) => {
    if (nextValue === "") {
      onChange("");
      return;
    }

    const parsedValue = Number(nextValue);
    if (Number.isFinite(parsedValue)) {
      setValue(parsedValue);
    }
  };

  return (
    <section
      className="flex min-w-0 flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
      aria-labelledby={`${id}-label`}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <Label
          id={`${id}-label`}
          htmlFor={id}
          className="flex items-start gap-2 text-sm font-medium text-foreground"
        >
          <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="[overflow-wrap:anywhere]">{label}</span>
        </Label>
        <p
          id={`${id}-current`}
          className="flex flex-wrap items-baseline gap-x-2 text-xs leading-5 text-muted-foreground"
        >
          <span>当前累计</span>
          <span className="font-medium tabular-nums text-foreground">
            {currentValue ?? "--"}
            {currentValue !== undefined && <span className="ml-1">{unit}</span>}
          </span>
        </p>
        <p id={`${id}-maximum`} className="text-xs leading-5 text-muted-foreground">
          本次最多增加 {maximum} {unit}
        </p>
      </div>

      <div className="w-full min-w-0 space-y-2 sm:w-56 sm:shrink-0">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="shadow-none"
            disabled={numericValue === 0}
            onClick={() => setValue(numericValue - step)}
            aria-label={`${label}减少 ${step}${unit}`}
            title={`减少 ${step}${unit}`}
          >
            <Minus className="size-4" aria-hidden="true" />
          </Button>
          <div className="relative min-w-0 flex-1">
            <Input
              id={id}
              type="number"
              inputMode="numeric"
              min={0}
              max={maximum}
              step={step}
              value={value}
              onChange={(event) => updateValue(event.target.value)}
              className="h-9 pr-12 text-center font-medium tabular-nums shadow-none"
              aria-describedby={`${id}-current ${id}-maximum`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
              {unit}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="shadow-none"
            disabled={numericValue === maximum}
            onClick={() => setValue(numericValue + step)}
            aria-label={`${label}增加 ${step}${unit}`}
            title={`增加 ${step}${unit}`}
          >
            <Plus className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={presets.includes(numericValue) ? String(numericValue) : ""}
            onValueChange={(nextValue) => setValue(Number(nextValue))}
          >
            <SelectTrigger
              className="min-w-0 flex-1 data-[size=default]:h-9"
              aria-label={`${label}常用增加量`}
            >
              <SelectValue placeholder="常用增加量" />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset} value={String(preset)}>
                  {preset} {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            disabled={numericValue === 0}
            title="清零"
            aria-label={`${label}清零`}
            onClick={() => onChange("")}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
          </Button>
        </div>
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
      initialValue={
        values[course.key] ?? {
          visitCount: 0,
          videoStudyMinutes: 0,
          readMinutes: 0,
        }
      }
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
    visitCount: initialVisitCount === 0 ? "" : String(initialVisitCount),
    videoStudyMinutes:
      initialVideoStudyMinutes === 0 ? "" : String(initialVideoStudyMinutes),
    readMinutes: initialReadMinutes === 0 ? "" : String(initialReadMinutes),
  });

  const updateDraft = (field: keyof StudyIncrement, value: string) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
  };

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(course.key, {
      visitCount: draft.visitCount === "" ? 0 : Number(draft.visitCount),
      videoStudyMinutes:
        draft.videoStudyMinutes === "" ? 0 : Number(draft.videoStudyMinutes),
      readMinutes:
        hasReadTaskPoints && draft.readMinutes !== ""
          ? Number(draft.readMinutes)
          : 0,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-2rem)] sm:max-w-xl">
        <DialogHeader className="border-b border-border px-4 py-4 pr-12 sm:px-6 sm:py-5 sm:pr-12">
          <DialogTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
            学习目标
          </DialogTitle>
          <DialogDescription className="text-start leading-5 [overflow-wrap:anywhere]">
            {course.courseName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={save} className="contents">
          <div className="min-h-0 min-w-0 space-y-5 overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
            {!courseDetailsReady ? (
              <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center" role={courseDetailsLoading ? "status" : "alert"}>
                {courseDetailsLoading ? (
                  <>
                    <LoaderCircle className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm font-medium text-foreground">
                      正在读取课程任务
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-5 text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm font-medium text-foreground">
                      课程任务读取失败
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                {!studyStats?.available && (
                  <div
                    className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"
                    role="status"
                  >
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    <span>{studyStats?.message || "当前学习数据不可用"}</span>
                  </div>
                )}

                <h3 className="text-sm font-semibold text-foreground">
                  本次增加
                </h3>

                <div className="divide-y divide-border">
                  <StepperField
                    id={`study-visit-${course.key}`}
                    icon={Eye}
                    label="学习次数"
                    value={draft.visitCount}
                    currentValue={
                      studyStats?.available ? studyStats.visitCount : undefined
                    }
                    maximum={400}
                    step={1}
                    presets={[10, 20, 50, 100]}
                    unit="次"
                    onChange={(value) => updateDraft("visitCount", value)}
                  />
                  <StepperField
                    id={`study-video-minutes-${course.key}`}
                    icon={Clock3}
                    label="视频观看时长"
                    value={draft.videoStudyMinutes}
                    currentValue={
                      studyStats?.available
                        ? studyStats.videoStudyMinutes
                        : undefined
                    }
                    maximum={4000}
                    step={10}
                    presets={[30, 60, 120, 300]}
                    unit="分钟"
                    onChange={(value) =>
                      updateDraft("videoStudyMinutes", value)
                    }
                  />
                  {hasReadTaskPoints && (
                    <StepperField
                      id={`study-read-${course.key}`}
                      icon={BookOpen}
                      label="阅读时长"
                      value={draft.readMinutes}
                      currentValue={
                        studyStats?.available
                          ? studyStats.readMinutes
                          : undefined
                      }
                      maximum={4000}
                      step={10}
                      presets={[30, 60, 120, 300]}
                      unit="分钟"
                      onChange={(value) => updateDraft("readMinutes", value)}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-4 sm:pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={!courseDetailsReady}>
              保存目标
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
