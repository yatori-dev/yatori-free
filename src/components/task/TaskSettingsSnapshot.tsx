import { Settings2 } from 'lucide-react';
import type {
  CoursesCustom,
  TaskConfigSnapshot,
} from '@/lib/api';
import { DetailRow } from '@/components/common/DetailRow';

interface TaskSettingsSnapshotProps {
  config?: TaskConfigSnapshot;
  coursesCustom: CoursesCustom;
  workAutoSubmitLabel: string;
  examAutoSubmitLabel: string;
}

export function TaskSettingsSnapshot({
  config,
  coursesCustom,
  workAutoSubmitLabel,
  examAutoSubmitLabel,
}: TaskSettingsSnapshotProps) {
  const showChapterStrategy =
    config?.kind === 'task_points' ||
    (config?.kind === undefined && coursesCustom.doChapterTest !== false);
  const showWorkStrategy =
    config?.kind === 'works' ||
    (config?.kind === undefined && coursesCustom.doWork);
  const showExamStrategy =
    config?.kind === 'exams' ||
    (config?.kind === undefined && coursesCustom.doExam);
  const chapterStrategyLabel =
    coursesCustom.doChapterTest === false ? '仅视频' : '自动答题';
  const aggressiveModeLabel =
    config?.executionMode === 'aggressive'
      ? '已启用'
      : config?.executionMode === 'normal'
        ? '未启用'
        : '未记录';

  return (
    <div className="mt-1 min-w-0 w-full space-y-3 border-t border-border pt-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5 border-b border-border/50 pb-1.5 text-xs font-semibold text-foreground">
        <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
        <span>任务配置</span>
      </div>
      <div className="space-y-2 font-sans">
        <DetailRow label="暴力模式">
          {aggressiveModeLabel}
        </DetailRow>
        {showChapterStrategy && (
          <DetailRow label={config?.kind ? '答题策略' : '章节答题策略'}>
            {chapterStrategyLabel}
          </DetailRow>
        )}
        {showWorkStrategy && (
          <DetailRow label={config?.kind ? '答题策略' : '作业答题策略'}>
            {workAutoSubmitLabel}
          </DetailRow>
        )}
        {showExamStrategy && (
          <DetailRow label={config?.kind ? '答题策略' : '考试答题策略'}>
            {examAutoSubmitLabel}
          </DetailRow>
        )}
      </div>
    </div>
  );
}
