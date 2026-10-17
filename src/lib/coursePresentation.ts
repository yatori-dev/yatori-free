import type {
  CourseDocument,
  CourseSummary,
  CourseTaskPointKind,
} from '@/lib/api';

export const COURSE_TASK_POINT_KIND_LABELS: Record<
  CourseTaskPointKind,
  string
> = {
  video: '视频',
  audio: '音频',
  chapter_test: '章节测验',
  document: '文档',
  reading: '阅读',
  hyperlink: '链接',
  live: '直播',
  discussion: '讨论',
  microcourse: '微课',
  other: '其他',
};

export function courseHasTaskPoints(course: CourseSummary) {
  if (typeof course.jobCount !== 'number') {
    return true;
  }

  return course.jobCount > 0;
}

export function isCourseEnded(course: Pick<CourseSummary, 'state' | 'endDate'>) {
  if (course.state === 1) {
    return true;
  }

  if (course.state === 0) {
    return false;
  }

  const endDate = course.endDate;
  if (typeof endDate !== 'string' || !endDate.trim()) {
    return false;
  }

  const endAt = Date.parse(endDate);
  return Number.isFinite(endAt) && endAt <= Date.now();
}

export function isSubmittedWorkStatus(status: string) {
  const normalized = status.trim().toLowerCase();
  if (/^(未交|未提交|未完成|待提交|待完成)$/.test(normalized)) {
    return false;
  }

  return [
    '已交',
    '已提交',
    '已交卷',
    '提交成功',
    '交卷成功',
    '已保存',
    '保存成功',
    '已作答',
    '已答题',
    '待批阅',
    '待评分',
    '已批阅',
    '已完成',
    'submitted',
    'finished',
    'completed',
  ].some((value) => normalized === value || normalized.includes(value));
}

export function getRemainingRedoCount(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return value;
}

export function getSubmittedRedoCount(status: string, value?: number | null) {
  if (!isSubmittedWorkStatus(status)) {
    return null;
  }

  return getRemainingRedoCount(value);
}

export function formatFileSize(size?: number) {
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) {
    return '';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const digits = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[unitIndex]}`;
}

export function getCourseDocumentTypeLabel(document: CourseDocument) {
  const extension = document.extension.trim().replace(/^\./, '').toUpperCase();
  return extension || document.type.toUpperCase();
}

export function getCourseDocumentFileName(document: CourseDocument) {
  const extension = document.extension.trim().replace(/^\./, '');
  const name = document.name.trim();

  if (
    !extension ||
    name.toLowerCase().endsWith(`.${extension.toLowerCase()}`)
  ) {
    return name;
  }

  return `${name}.${extension}`;
}
