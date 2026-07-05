import type { Chapter } from './api';

export interface ChapterTaskMeta {
  total: number;
  finished: number;
  isLocked: boolean;
  hasTaskPoints: boolean;
}

type RawRecord = Record<string, unknown>;

const CHAPTER_ARRAY_KEYS = [
  'knowledge',
  'chapters',
  'chapterList',
  'chapterlist',
  'chapterData',
  'chapterListData',
  'data',
  'list',
  'items',
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

function getStringValue(record: RawRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return '';
}

function getValue(record: RawRecord, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }

  return undefined;
}

function hasChapterMetric(record: RawRecord) {
  return [
    'pointTotal',
    'pointFinished',
    'PointTotal',
    'PointFinished',
    'totalCount',
    'finishCount',
    'unfinishCount',
    'jobcount',
    'jobCount',
    'jobFinishCount',
    'openlock',
    'openLock',
    'isOpen',
    'status',
  ].some((key) => record[key] !== undefined && record[key] !== null);
}

function toChapter(record: RawRecord, fallbackId: string): Chapter | null {
  const name = getStringValue(record, ['name', 'title', 'chapterName', 'labelName']);
  const label = getStringValue(record, ['label', 'index', 'sort', 'order', 'chapterIndex']);
  const id = getValue(record, ['id', 'chapterId', 'knowledgeId', 'objectId']) ?? fallbackId;

  if (!name || !hasChapterMetric(record)) {
    return null;
  }

  return {
    ...record,
    id: typeof id === 'string' || typeof id === 'number' ? id : fallbackId,
    name,
    label: label || '',
  } as Chapter;
}

export function extractChapterItems(chapters: unknown): Chapter[] {
  const result: Chapter[] = [];
  const seen = new Set<string>();

  const collect = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (!isRecord(item)) {
          return;
        }

        const chapter = toChapter(item, `${path}.${index}`);
        if (chapter) {
          const key = `${String(chapter.id)}:${chapter.label}:${chapter.name}`;
          if (!seen.has(key)) {
            seen.add(key);
            result.push(chapter);
          }
        }

        collect(item, `${path}.${index}`);
      });
      return;
    }

    if (!isRecord(value)) {
      return;
    }

    for (const key of CHAPTER_ARRAY_KEYS) {
      const child = value[key];
      if (Array.isArray(child)) {
        collect(child, `${path}.${key}`);
      }
    }

    Object.entries(value).forEach(([key, child]) => {
      if (CHAPTER_ARRAY_KEYS.includes(key as (typeof CHAPTER_ARRAY_KEYS)[number])) {
        return;
      }

      if (Array.isArray(child) || isRecord(child)) {
        collect(child, `${path}.${key}`);
      }
    });
  };

  collect(chapters, 'chapters');
  return result;
}

function getChapterLockState(chapter: Chapter) {
  if (typeof chapter.isOpen === 'boolean') {
    return !chapter.isOpen;
  }

  const openLock = toSafeNumber(chapter.openlock) || toSafeNumber(chapter.openLock);
  if (openLock > 0) {
    return true;
  }

  if (typeof chapter.status !== 'string') {
    return false;
  }

  const normalizedStatus = chapter.status.trim().toLowerCase();
  return ['locked', 'notopen', 'unopen', 'unopened', '未开放', '未开启'].some((flag) => normalizedStatus.includes(flag));
}

function isTaskGateStatus(status?: string) {
  if (typeof status !== 'string') {
    return false;
  }

  return status.trim().toLowerCase() === 'task';
}

function getNumber(chapter: Chapter, keys: Array<keyof Chapter>) {
  for (const key of keys) {
    const value = toSafeNumber(chapter[key]);
    if (value > 0) {
      return value;
    }
  }

  return 0;
}

function hasValue(chapter: Chapter, key: keyof Chapter) {
  return chapter[key] !== undefined && chapter[key] !== null;
}

function isFinishedStatus(status?: string) {
  if (typeof status !== 'string') {
    return false;
  }

  const normalizedStatus = status.trim().toLowerCase();
  return ['finished', 'complete', 'completed', 'done', 'finish', 'success', '已完成', '完成'].some((flag) => normalizedStatus.includes(flag));
}

export function getChapterTaskMeta(chapter: Chapter): ChapterTaskMeta {
  const totalCount = toSafeNumber(chapter.totalCount);
  const unfinishCount = toSafeNumber(chapter.unfinishCount);
  const pointTotal = getNumber(chapter, ['pointTotal', 'PointTotal']);
  const pointFinished = getNumber(chapter, ['pointFinished', 'PointFinished']);
  const finishCount = toSafeNumber(chapter.finishCount);
  const jobCount = toSafeNumber(chapter.jobcount) || toSafeNumber(chapter.jobCount);
  const jobFinishCount = toSafeNumber(chapter.jobFinishCount);
  const derivedTotal = finishCount + unfinishCount;
  const hasUnfinishCount = hasValue(chapter, 'unfinishCount');
  const isLocked = getChapterLockState(chapter);

  if (isLocked) {
    const total = pointTotal || totalCount || jobCount || derivedTotal || unfinishCount;
    return {
      total,
      finished: 0,
      isLocked: total > 0,
      hasTaskPoints: total > 0,
    };
  }

  const total = pointTotal || totalCount || jobCount || derivedTotal || unfinishCount;
  const finished = pointFinished
    || finishCount
    || jobFinishCount
    || (total > 0 && hasUnfinishCount ? Math.max(total - unfinishCount, 0) : 0)
    || (total > 0 && isFinishedStatus(chapter.status) ? total : 0);

  return {
    total,
    finished: Math.min(finished, total || finished),
    isLocked: false,
    hasTaskPoints: total > 0,
  };
}

export function getChapterTaskMetas(chapters: Chapter[]) {
  const baseMetas = chapters.map((chapter) => ({
    chapter,
    taskMeta: getChapterTaskMeta(chapter),
  }));

  const isTaskGateMode = chapters.some((chapter) => isTaskGateStatus(chapter.status));
  if (!isTaskGateMode) {
    return baseMetas;
  }

  let encounteredCurrentChapter = false;

  return baseMetas.map(({ chapter, taskMeta }) => {
    if (!taskMeta.hasTaskPoints || taskMeta.isLocked || taskMeta.finished >= taskMeta.total) {
      return { chapter, taskMeta };
    }

    if (!encounteredCurrentChapter) {
      encounteredCurrentChapter = true;
      return { chapter, taskMeta };
    }

    return {
      chapter,
      taskMeta: {
        ...taskMeta,
        isLocked: true,
        finished: 0,
      },
    };
  });
}
