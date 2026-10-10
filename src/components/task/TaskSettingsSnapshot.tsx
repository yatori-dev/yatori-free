import { Settings2, Target } from 'lucide-react';
import type {
  CoursesCustom,
  TaskConfigSnapshot,
  StudyIncrement,
} from '@/lib/api';
import { DetailRow } from '@/components/common/DetailRow';

interface TaskSettingsSnapshotProps {
  config?: TaskConfigSnapshot;
  coursesCustom: CoursesCustom;
  courseNameByIdentifier: Record<string, string>;
  studyIncrementSettings: Array<{
    classId: string;
    studyIncrement: StudyIncrement;
  }>;
  workAutoSubmitLabel: string;
  examAutoSubmitLabel: string;
}

export function TaskSettingsSnapshot({
  config,
  coursesCustom,
  courseNameByIdentifier,
  studyIncrementSettings,
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
        {showWorkStrategy && (coursesCustom.workAutoSubmitBeforeDeadlineMinutes ?? 0) > 0 && (
          <DetailRow label="截止前强制提交">
            {coursesCustom.workAutoSubmitBeforeDeadlineMinutes} 分钟
          </DetailRow>
        )}
        {showExamStrategy && (
          <DetailRow label={config?.kind ? '答题策略' : '考试答题策略'}>
            {examAutoSubmitLabel}
          </DetailRow>
        )}
        {showChapterStrategy && (coursesCustom.forceAggressiveBeforeCourseEndHours ?? 0) > 0 && (
          <DetailRow label="结课前自动提速">
            {coursesCustom.forceAggressiveBeforeCourseEndHours} 小时
          </DetailRow>
        )}
        {coursesCustom.answerMode && (
          <DetailRow label="答题模式">{coursesCustom.answerMode}</DetailRow>
        )}
        {studyIncrementSettings.length > 0 && (
          <div className="space-y-1.5 border-t border-border/50 pt-2.5">
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3 text-muted-foreground" />
              学习目标
            </span>
            {studyIncrementSettings.map(({ classId, studyIncrement }) => {
              const name = courseNameByIdentifier[classId] ?? classId;
              const increments = [
                (studyIncrement.visitCount ?? 0) > 0
                  ? `学习次数 +${studyIncrement.visitCount}`
                  : null,
                (studyIncrement.videoStudyMinutes ?? 0) > 0
                  ? `视频观看 +${studyIncrement.videoStudyMinutes} 分钟`
                  : null,
                (studyIncrement.readMinutes ?? 0) > 0
                  ? `阅读 +${studyIncrement.readMinutes} 分钟`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ');
              return (
                <div
                  key={classId}
                  className="flex min-w-0 flex-col gap-1 py-1 text-foreground sm:flex-row sm:justify-between sm:gap-4"
                >
                  <span className="truncate" title={name}>
                    {name}
                  </span>
                  <span className="min-w-0 font-medium tabular-nums wrap-anywhere sm:text-right">
                    {increments || '未设置'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
