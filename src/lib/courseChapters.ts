import type { Chapter, CourseDocument } from './api';

export interface ChapterTaskMeta {
  total: number;
  finished: number;
  isLocked: boolean;
  hasTaskPoints: boolean;
}

type RawRecord = Record<string, unknown>;

const CHAPTER_ARRAY_KEYS = [
  'knowledge',
  'children',
] as const;

function toSafeNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function isRecord(value: unknown): value is RawRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasChapterMetric(record: RawRecord) {
  return [
    'pointTotal',
    'pointFinished',
    'PointTotal',
    'PointFinished',
    'jobcount',
    'jobFinishCount',
    'openlock',
    'isOpen',
  ].some((key) => record[key] !== undefined && record[key] !== null);
}

function toChapter(record: RawRecord): Chapter | null {
  const id = record.id;
  const name = record.name;
  const label = record.label;

  if (
    (typeof id !== 'string' && typeof id !== 'number')
    || typeof name !== 'string'
    || !name.trim()
    || !hasChapterMetric(record)
  ) {
    return null;
  }

  return {
    ...record,
    id,
    name: name.trim(),
    label: typeof label === 'string' ? label.trim() : '',
  } as Chapter;
}

export function extractChapterItems(chapters: unknown): Chapter[] {
  const result: Chapter[] = [];
  const seen = new Set<string>();

  const collect = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (!isRecord(item)) {
          return;
        }

        const chapter = toChapter(item);
        if (chapter) {
          const key = `${String(chapter.id)}:${chapter.label}:${chapter.name}`;
          if (!seen.has(key)) {
            seen.add(key);
            result.push(chapter);
          }
        }

        collect(item.children);
      });
      return;
    }

    if (!isRecord(value)) {
      return;
    }

    for (const key of CHAPTER_ARRAY_KEYS) {
      const child = value[key];
      if (Array.isArray(child)) {
        collect(child);
      }
    }
  };

  collect(chapters);
  return result;
}

function getChapterLockState(chapter: Chapter) {
  if (typeof chapter.isOpen === 'boolean') {
    return !chapter.isOpen;
  }

  const openLock = toSafeNumber(chapter.openlock);
  if (openLock > 0) {
    return true;
  }
}

function getNumber(chapter: Chapter, keys: Array<keyof Chapter>) {
  for (const key of keys) {
    const rawValue = chapter[key];
    if (rawValue !== undefined && rawValue !== null) {
      return toSafeNumber(rawValue);
    }
  }

  return 0;
}

export function getChapterTaskMeta(chapter: Chapter): ChapterTaskMeta {
  const pointTotal = getNumber(chapter, ['pointTotal', 'PointTotal']);
  const pointFinished = getNumber(chapter, ['pointFinished', 'PointFinished']);
  const jobCount = getNumber(chapter, ['jobcount', 'jobCount']);
  const jobFinishCount = toSafeNumber(chapter.jobFinishCount);
  const isLocked = getChapterLockState(chapter);
  const total = pointTotal || jobCount;
  const finished = pointTotal > 0 ? pointFinished : jobFinishCount;

  if (isLocked) {
    return {
      total,
      finished: 0,
      isLocked: total > 0,
      hasTaskPoints: total > 0,
    };
  }

  return {
    total,
    finished: Math.min(finished, total || finished),
    isLocked: false,
    hasTaskPoints: total > 0,
  };
}

export function getChapterTaskMetas(chapters: Chapter[]) {
  return chapters.map((chapter) => ({
    chapter,
    taskMeta: getChapterTaskMeta(chapter),
  }));
}

function normalizeMatchValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return '';
}

export function getChapterDocuments(chapter: Chapter, documents: CourseDocument[] = []) {
  const chapterId = normalizeMatchValue(chapter.id);
  return documents.filter((document) => {
    const documentChapterId = normalizeMatchValue(document.chapterId);
    return Boolean(chapterId && documentChapterId && chapterId === documentChapterId);
  });
}
