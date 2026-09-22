import { AlertCircle, ChevronDown, ChevronUp, Download, FileText } from 'lucide-react';
import type { CourseDetails } from '@/lib/api';
import { getCourseDocumentDownloadUrl } from '@/lib/api';
import { extractChapterItems, getChapterDocuments, getChapterTaskMetas, getCourseTaskPointGroups } from '@/lib/courseChapters';
import { COURSE_TASK_POINT_KIND_LABELS, formatFileSize, getCourseDocumentFileName, getCourseDocumentTypeLabel } from '@/lib/coursePresentation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CourseOutlineProps {
  accountId?: string;
  courseKey: string;
  courseDetails: CourseDetails;
  isFullyExpanded: boolean;
  onToggleFullOutline: () => void;
}

export function CourseOutline({ accountId, courseKey, courseDetails, isFullyExpanded, onToggleFullOutline }: CourseOutlineProps) {
  const chapterItems = extractChapterItems(courseDetails.chapters);
  const taskPointGroups = getCourseTaskPointGroups(courseDetails.taskPoints);
  const chaptersWithTasks = taskPointGroups.length > 0
    ? taskPointGroups.map(({ chapter, taskPoints }) => ({ chapter, taskPoints, taskMeta: { total: taskPoints.length, finished: taskPoints.filter((taskPoint) => taskPoint.completed === true).length, isLocked: false, hasTaskPoints: true } }))
    : getChapterTaskMetas(chapterItems).filter(({ taskMeta }) => taskMeta.hasTaskPoints).map(({ chapter, taskMeta }) => ({ chapter, taskMeta, taskPoints: [] }));

  return (
    <div className="space-y-2">
      {courseDetails.incomplete && <div className="flex items-start gap-2 rounded-md bg-warning-container/40 px-2.5 py-2 text-xs text-warning" role="status"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>部分课程数据读取失败，当前大纲可能不完整。</span></div>}
      {courseDetails.taskPointsIncomplete && <div className="flex items-start gap-2 rounded-md bg-warning-container/40 px-2.5 py-2 text-xs text-warning" role="status"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{courseDetails.partialReasons?.join('；') || '任务点读取不完整，当前仅展示已读取内容。'}</span></div>}
      <div className={isFullyExpanded ? undefined : 'max-sm:max-h-64 max-sm:overflow-hidden'}>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">章节大纲 ({chaptersWithTasks.length})</div>
        <div className="grid grid-cols-1 gap-2 pr-1 md:max-h-[300px] md:grid-cols-2 md:overflow-y-auto">
          {chaptersWithTasks.map(({ chapter: chapterItem, taskMeta, taskPoints }) => {
            const isChapterDone = !taskMeta.isLocked && taskMeta.total > 0 && taskMeta.finished === taskMeta.total;
            const chapterDocuments = getChapterDocuments(chapterItem, courseDetails.documents);
            const statusClassName = taskMeta.isLocked ? 'border-border bg-muted text-muted-foreground' : isChapterDone ? 'border-success/20 bg-success-container text-success' : 'border-warning/20 bg-warning-container text-warning';
            return <div key={chapterItem.id} className="rounded-lg border border-border/60 bg-card p-3 text-xs shadow-xs transition-all duration-150 hover:border-primary/30 hover:shadow-sm">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><span className="mr-1.5 font-semibold text-muted-foreground">{chapterItem.label}</span><span className="font-medium text-foreground">{chapterItem.name}</span></div><Badge className={`shrink-0 border text-xs font-normal ${statusClassName}`}>{taskPoints.length > 0 ? `任务点: ${taskMeta.finished}/${taskMeta.total}` : taskMeta.isLocked ? `未开放任务点: ${taskMeta.total}` : `任务点: ${taskMeta.finished}/${taskMeta.total}`}</Badge></div>
              {taskPoints.length > 0 && <div className="mt-2 space-y-1.5 border-t border-border/50 pt-2">{taskPoints.map((taskPoint) => <div key={taskPoint.id} className="flex items-center gap-2 rounded-md bg-muted/40 px-2.5 py-1.5 transition-colors hover:bg-muted/70"><span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">{COURSE_TASK_POINT_KIND_LABELS[taskPoint.kind]}</span><span className="min-w-0 flex-1 truncate text-foreground" title={taskPoint.title}>{taskPoint.title || taskPoint.module}</span>{taskPoint.completed !== undefined && <span className={taskPoint.completed ? 'shrink-0 text-[11px] text-success' : 'shrink-0 text-[11px] text-muted-foreground'}>{taskPoint.completed ? '已完成' : '未完成'}</span>}</div>)}</div>}
              {accountId && chapterDocuments.length > 0 && <div className="mt-2 space-y-1.5 border-t border-border/50 pt-2">{chapterDocuments.map((document) => { const fileSize = formatFileSize(document.size); const fileName = getCourseDocumentFileName(document); return <div key={document.id} className="flex items-center gap-2 rounded-md bg-muted/40 px-2.5 py-1.5 transition-colors hover:bg-muted/70"><FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><div className="truncate font-medium text-foreground">{document.name}</div><div className="text-xs text-muted-foreground">{getCourseDocumentTypeLabel(document)}{fileSize ? ` · ${fileSize}` : ''}</div></div><Button asChild variant="ghost" size="sm" className="h-7 w-7 shrink-0 rounded p-0 text-primary hover:bg-primary/10 active:scale-[0.95] transition-all"><a href={getCourseDocumentDownloadUrl(accountId, courseKey, document.id)} download={fileName} aria-label={`下载 ${document.name}`}><Download className="h-3.5 w-3.5" /></a></Button></div>; })}</div>}
            </div>;
          })}
          {chaptersWithTasks.length === 0 && <div className="col-span-2 py-4 text-center text-xs text-muted-foreground">{courseDetails.incomplete ? '课程数据读取不完整' : '该课程没有任务点'}</div>}
        </div>
      </div>
      {chaptersWithTasks.length > 3 && <Button type="button" variant="ghost" size="sm" className="mt-2 h-8 w-full gap-1 text-xs text-primary sm:hidden" onClick={onToggleFullOutline} aria-expanded={isFullyExpanded}>{isFullyExpanded ? <><span>收起章节列表</span><ChevronUp className="h-3.5 w-3.5" /></> : <><span>显示全部 {chaptersWithTasks.length} 个章节</span><ChevronDown className="h-3.5 w-3.5" /></>}</Button>}
    </div>
  );
}
