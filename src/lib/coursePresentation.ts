import type { CourseDocument, CourseSummary, CourseTaskPointKind } from '@/lib/api';

export const COURSE_TASK_POINT_KIND_LABELS: Record<CourseTaskPointKind, string> = {
  video: '视频',
  audio: '音频',
  chapter_test: '章节测验',
  document: '文档',
  reading: '阅读',
  hyperlink: '链接',
  live: '直播',
  discussion: '讨论',
  other: '其他',
};

export function courseHasTaskPoints(course: CourseSummary) {
  if (typeof course.jobCount !== 'number') {
    return true;
  }

  return course.jobCount > 0;
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

  if (!extension || name.toLowerCase().endsWith(`.${extension.toLowerCase()}`)) {
    return name;
  }

  return `${name}.${extension}`;
}
