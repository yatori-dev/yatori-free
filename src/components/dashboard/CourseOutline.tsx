import { useId, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  RefreshCw,
} from 'lucide-react';
import type { CourseDetails } from '@/lib/api';
import { getCourseDocumentDownloadUrl } from '@/lib/api';
import {
  extractChapterItems,
  getChapterDocuments,
  getChapterTaskMeta,
  getCourseTaskPointGroups,
} from '@/lib/courseChapters';
import {
  COURSE_TASK_POINT_KIND_LABELS,
  formatFileSize,
  getCourseDocumentFileName,
  getCourseDocumentTypeLabel,
} from '@/lib/coursePresentation';
import { useCourseChapterDetails } from '@/hooks/useCourseChapterDetails';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CourseOutlineProps {
  accountId?: string;
  courseKey: string;
  courseDetails: CourseDetails;
  isFullyExpanded: boolean;
  onToggleFullOutline: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  error?: string;
  revision?: number;
}

export function CourseOutline(props: CourseOutlineProps) {
  return (
    <CourseOutlineContent
      key={`${props.accountId}:${props.courseKey}:${props.revision ?? 0}`}
      {...props}
    />
  );
}

function CourseOutlineContent({
  accountId,
  courseKey,
  courseDetails,
  isFullyExpanded,
  onToggleFullOutline,
  onRefresh,
  refreshing = false,
  error,
}: CourseOutlineProps) {
  const outlineId = useId();
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const { chapterDetails, loadChapter } = useCourseChapterDetails(accountId, courseKey);
  const chapters = extractChapterItems(courseDetails.chapters);
  const existingTaskPointGroups = getCourseTaskPointGroups(courseDetails.taskPoints);
  for (const { chapter } of existingTaskPointGroups) {
    if (!chapters.some((item) => String(item.id) === String(chapter.id))) {
      chapters.push(chapter);
    }
  }

  const toggleChapter = (chapterId: number | string) => {
    const key = String(chapterId);
    const opening = !expandedChapters.has(key);
    setExpandedChapters((previous) => {
      const next = new Set(previous);
      if (opening) next.add(key);
      else next.delete(key);
      return next;
    });
    if (opening) void loadChapter(chapterId);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-muted-foreground">
          章节大纲 ({chapters.length})
        </div>
        {onRefresh && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            disabled={refreshing}
            onClick={onRefresh}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? '刷新中' : '刷新章节'}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-danger" role="alert">{error}</p>}
      {(courseDetails.incomplete || courseDetails.taskPointsIncomplete) && (
        <div className="flex items-start gap-2 text-xs text-warning" role="status">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {courseDetails.partialReasons?.join('；') ||
              '部分章节读取失败，请刷新章节重试'}
          </span>
        </div>
      )}
      <div className="divide-y divide-border/60 md:max-h-[400px] md:overflow-y-auto">
        {chapters.map((chapter, index) => {
          const key = String(chapter.id);
          const state = chapterDetails[key];
          const details = state?.data;
          const taskPoints = (details?.taskPoints ?? courseDetails.taskPoints ?? []).filter(
            (taskPoint) => String(taskPoint.chapterId) === key,
          );
          const documents = getChapterDocuments(
            chapter,
            details?.documents ?? courseDetails.documents,
          );
          const currentChapter = extractChapterItems(details?.chapters).find(
            (item) => String(item.id) === key,
          ) ?? chapter;
          const taskMeta = getChapterTaskMeta(currentChapter);
          const incomplete = details?.incomplete || details?.taskPointsIncomplete;
          const hasKnownTaskPointStatus = !incomplete && taskPoints.length > 0 &&
            taskPoints.every((taskPoint) => taskPoint.completed !== undefined);
          const total = hasKnownTaskPointStatus ? taskPoints.length : taskMeta.total || taskPoints.length;
          const finished = hasKnownTaskPointStatus
            ? taskPoints.filter((taskPoint) => taskPoint.completed).length
            : taskMeta.finished;
          const isDone = !taskMeta.isLocked && total > 0 && finished === total;
          const expanded = expandedChapters.has(key);
          const panelId = `${outlineId}-${key}`;

          return (
            <div
              key={key}
              className={!isFullyExpanded && index >= 3 ? 'hidden sm:block' : undefined}
            >
              <button
                type="button"
                onClick={() => toggleChapter(chapter.id)}
                className="flex w-full items-start gap-2 rounded-[var(--radius-sm)] py-3 text-left text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-expanded={expanded}
                aria-controls={panelId}
              >
                <ChevronDown className={`mt-0.5 h-3.5 w-3.5 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                <span className="min-w-0 flex-1 break-words font-medium text-foreground">
                  {chapter.label && (
                    <span className="mr-1.5 text-muted-foreground">{chapter.label}</span>
                  )}
                  {chapter.name}
                </span>
                <Badge
                  variant={taskMeta.isLocked || total === 0 ? 'secondary' : isDone ? 'success' : 'warning'}
                  className="shrink-0 text-xs font-normal"
                >
                  {taskMeta.isLocked ? `未开放: ${total}` : total > 0 ? `任务点: ${finished}/${total}` : '无任务点'}
                </Badge>
              </button>
              {expanded && (
                <div
                  id={panelId}
                  className="space-y-2 pb-3 pl-5.5 text-xs"
                  aria-busy={state?.loading}
                >
                  {accountId && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground" role="status">
                        {state?.loading ? '正在读取任务点…' : '章节任务点'}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        disabled={state?.loading}
                        onClick={() => void loadChapter(chapter.id, true)}
                      >
                        <RefreshCw className={`h-3 w-3 ${state?.loading ? 'animate-spin' : ''}`} />
                        {state?.error || incomplete ? '重试' : '刷新'}
                      </Button>
                    </div>
                  )}
                  {state?.error && <p className="text-danger" role="alert">{state.error}</p>}
                  {incomplete && (
                    <p className="text-warning" role="status">
                      {details?.partialReasons?.join('；') || '本章任务点读取不完整，请重试'}
                    </p>
                  )}
                  {taskPoints.map((taskPoint) => (
                    <div key={taskPoint.id} className="flex items-start gap-2 py-1">
                      <span className="shrink-0 text-muted-foreground">
                        {COURSE_TASK_POINT_KIND_LABELS[taskPoint.kind]}
                      </span>
                      <span className="min-w-0 flex-1 break-words text-foreground">
                        {taskPoint.title || taskPoint.module}
                      </span>
                      {taskPoint.completed !== undefined && (
                        <span className={taskPoint.completed ? 'shrink-0 text-success' : 'shrink-0 text-muted-foreground'}>
                          {taskPoint.completed ? '已完成' : '未完成'}
                        </span>
                      )}
                    </div>
                  ))}
                  {accountId && documents.map((document) => {
                    const fileSize = formatFileSize(document.size);
                    return (
                      <div key={document.id} className="flex items-center gap-2 py-1">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="break-words font-medium text-foreground">{document.name}</div>
                          <div className="text-muted-foreground">
                            {getCourseDocumentTypeLabel(document)}{fileSize ? ` · ${fileSize}` : ''}
                          </div>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="h-7 w-7 shrink-0 p-0 text-primary">
                          <a
                            href={getCourseDocumentDownloadUrl(accountId, courseKey, document.id)}
                            download={getCourseDocumentFileName(document)}
                            aria-label={`下载 ${document.name}`}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    );
                  })}
                  {taskPoints.length === 0 && documents.length === 0 &&
                    !state?.loading && !state?.error && !incomplete && (
                    <p className="text-muted-foreground">
                      {details || !accountId
                        ? '本章没有可显示的任务点或文档'
                        : '展开后读取本章任务点'}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {chapters.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {courseDetails.incomplete ? '章节数据读取不完整，请刷新重试' : '该课程暂无章节'}
          </p>
        )}
      </div>
      {chapters.length > 3 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 h-8 w-full gap-1 text-xs text-primary sm:hidden"
          onClick={onToggleFullOutline}
          aria-expanded={isFullyExpanded}
        >
          {isFullyExpanded ? (
            <><span>收起章节列表</span><ChevronUp className="h-3.5 w-3.5" /></>
          ) : (
            <><span>显示全部 {chapters.length} 个章节</span><ChevronDown className="h-3.5 w-3.5" /></>
          )}
        </Button>
      )}
    </div>
  );
}
