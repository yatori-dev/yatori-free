import { Settings2, Sparkles } from 'lucide-react';
import type { CoursesCustom, TaskConfigSnapshot, StudyIncrement } from '@/lib/api';
import { DetailRow } from '@/components/common/DetailRow';

interface TaskSettingsSnapshotProps {
  config?: TaskConfigSnapshot;
  coursesCustom: CoursesCustom;
  courseNameByIdentifier: Record<string, string>;
  studyIncrementSettings: Array<{ classId: string; studyIncrement: StudyIncrement }>;
  workAutoSubmitLabel: string;
  examAutoSubmitLabel: string;
  enabledAutomationLabels: string[];
  hasRecordedAutomation: boolean;
}

export function TaskSettingsSnapshot({ config, coursesCustom, courseNameByIdentifier, studyIncrementSettings, workAutoSubmitLabel, examAutoSubmitLabel, enabledAutomationLabels, hasRecordedAutomation }: TaskSettingsSnapshotProps) {
  return (
    <div className="mt-1 min-w-0 w-full space-y-3 rounded-lg border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5 border-b border-border/50 pb-1.5 text-xs font-semibold text-foreground"><Settings2 className="w-3.5 h-3.5 text-muted-foreground" /><span>任务配置</span></div>
      <div className="space-y-2 font-sans">
        {config?.bypassDailyStudyLimit !== undefined && <DetailRow label="每日学时限制">{config.bypassDailyStudyLimit ? '已绕过' : '正常限制'}</DetailRow>}
        <DetailRow label="自动答题">{enabledAutomationLabels.length > 0 ? enabledAutomationLabels.join('、') : hasRecordedAutomation ? '未开启' : '未记录'}</DetailRow>
        {coursesCustom.doWork && <DetailRow label="作业提交">{workAutoSubmitLabel}</DetailRow>}
        {coursesCustom.doExam && <DetailRow label="考试提交">{examAutoSubmitLabel}</DetailRow>}
        {coursesCustom.answerMode && <DetailRow label="答题模式">{coursesCustom.answerMode}</DetailRow>}
        {studyIncrementSettings.length > 0 && <div className="space-y-1.5 border-t border-border/50 pt-2.5">
          <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" />学习目标</span>
          {studyIncrementSettings.map(({ classId, studyIncrement }) => {
            const name = courseNameByIdentifier[classId] ?? classId;
            const increments = [(studyIncrement.visitCount ?? 0) > 0 ? `学习次数 +${studyIncrement.visitCount}` : null, (studyIncrement.videoStudyMinutes ?? 0) > 0 ? `视频观看 +${studyIncrement.videoStudyMinutes} 分钟` : null, (studyIncrement.readMinutes ?? 0) > 0 ? `阅读 +${studyIncrement.readMinutes} 分钟` : null].filter(Boolean).join(' · ');
            return <div key={classId} className="flex justify-between gap-2 text-foreground"><span className="truncate" title={name}>{name}</span><span className="shrink-0 font-semibold tabular-nums">{increments || '未设置'}</span></div>;
          })}
        </div>}
      </div>
    </div>
  );
}
