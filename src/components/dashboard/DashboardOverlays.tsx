import { Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CourseDetails, CourseSummary, StudyIncrement } from '@/lib/api';
import { hasReadTaskPoints } from '@/lib/courseChapters';
import { NightTaskConfirmDialog } from './NightTaskConfirmDialog';
import { BypassDailyStudyLimitConfirmDialog } from './BypassDailyStudyLimitConfirmDialog';
import { LogoutConfirmDialog } from './LogoutConfirmDialog';
import { StudyIncrementSettings } from '@/components/StudyIncrementSettings';

interface DashboardOverlaysProps {
  selectedCount: number;
  creatingTask: boolean;
  estimatedTaskDuration: string | null;
  submitButtonText?: string;
  nightConfirmOpen: boolean;
  submitBypassConfirmOpen: boolean;
  logoutConfirmOpen: boolean;
  studyIncrementCourseKey: string | null;
  studyIncrementCourse: CourseSummary | null;
  studyIncrementCourseDetails?: CourseDetails;
  loadingDetails: Record<string, boolean>;
  studyIncrements: Record<string, StudyIncrement>;
  onCreateTask: () => void;
  onNightConfirmChange: (open: boolean) => void;
  onSubmitBypassConfirmChange: (open: boolean) => void;
  onLogoutConfirmChange: (open: boolean) => void;
  onConfirmNightTask: () => void;
  onExecuteSubmitTask: () => void;
  onStudyIncrementOpenChange: (open: boolean) => void;
  onSaveStudyIncrement: (classId: string, value: StudyIncrement) => void;
  onLogout: () => void;
}

export function DashboardOverlays({ selectedCount, creatingTask, estimatedTaskDuration, submitButtonText, nightConfirmOpen, submitBypassConfirmOpen, logoutConfirmOpen, studyIncrementCourseKey, studyIncrementCourse, studyIncrementCourseDetails, loadingDetails, studyIncrements, onCreateTask, onNightConfirmChange, onSubmitBypassConfirmChange, onLogoutConfirmChange, onConfirmNightTask, onExecuteSubmitTask, onStudyIncrementOpenChange, onSaveStudyIncrement, onLogout }: DashboardOverlaysProps) {
  return <>
    {selectedCount > 0 && <div className="absolute bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 animate-bottom-bar-enter lg:bottom-6"><div className="flex flex-col items-center gap-1"><Button type="button" onClick={onCreateTask} disabled={creatingTask} className="h-11 gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-floating ring-4 ring-card/80 hover:bg-primary-hover" title={submitButtonText ?? `提交 ${selectedCount} 项任务`} aria-label={submitButtonText ?? `提交 ${selectedCount} 项任务`}>{creatingTask ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4 fill-current" aria-hidden="true" />}<span>{submitButtonText ?? `提交任务(${selectedCount})`}</span></Button>{estimatedTaskDuration && <span className="whitespace-nowrap text-[11px] font-medium text-muted-foreground" role="status">预计所需{estimatedTaskDuration}</span>}</div></div>}
    <NightTaskConfirmDialog open={nightConfirmOpen} onOpenChange={onNightConfirmChange} onConfirm={onConfirmNightTask} />
    <BypassDailyStudyLimitConfirmDialog open={submitBypassConfirmOpen} onOpenChange={onSubmitBypassConfirmChange} onConfirm={onExecuteSubmitTask} />
    <LogoutConfirmDialog open={logoutConfirmOpen} onOpenChange={onLogoutConfirmChange} onConfirm={onLogout} />
    <StudyIncrementSettings open={studyIncrementCourseKey !== null} onOpenChange={onStudyIncrementOpenChange} course={studyIncrementCourse} hasReadTaskPoints={hasReadTaskPoints(studyIncrementCourseDetails)} studyStats={studyIncrementCourseDetails?.studyStats} statsLoaded={studyIncrementCourseDetails !== undefined} loadingStats={studyIncrementCourseKey !== null && loadingDetails[studyIncrementCourseKey] === true} values={studyIncrements} onSave={onSaveStudyIncrement} />
  </>;
}
