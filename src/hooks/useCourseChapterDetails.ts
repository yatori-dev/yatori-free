import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getCourseChapterDetails,
  getUserFacingErrorMessage,
  type CourseDetails,
} from '@/lib/api';

const CHAPTER_DETAILS_TTL_MS = 60_000;

interface ChapterDetailsState {
  data?: CourseDetails;
  loading: boolean;
  error?: string;
}

export function useCourseChapterDetails(accountId: string | undefined, courseKey: string) {
  const [chapterDetails, setChapterDetails] = useState<Record<string, ChapterDetailsState>>({});
  const cacheRef = useRef(new Map<string, { data: CourseDetails; fetchedAt: number }>());
  const inFlightRef = useRef(new Map<string, AbortController>());

  useEffect(() => {
    const inFlight = inFlightRef.current;
    return () => {
      for (const controller of inFlight.values()) controller.abort();
      inFlight.clear();
    };
  }, []);

  const loadChapter = useCallback(async (chapterId: number | string, refresh = false) => {
    if (!accountId) return;
    const key = String(chapterId);
    if (inFlightRef.current.has(key)) return;
    const cached = cacheRef.current.get(key);
    if (!refresh && cached && !cached.data.incomplete && !cached.data.taskPointsIncomplete &&
      Date.now() - cached.fetchedAt < CHAPTER_DETAILS_TTL_MS) return;

    const controller = new AbortController();
    inFlightRef.current.set(key, controller);
    setChapterDetails((previous) => ({
      ...previous,
      [key]: { data: previous[key]?.data, loading: true },
    }));

    try {
      const response = await getCourseChapterDetails(accountId, courseKey, chapterId, {
        signal: controller.signal,
        refresh: refresh || Boolean(cached),
      });
      if (controller.signal.aborted || inFlightRef.current.get(key) !== controller) return;
      cacheRef.current.set(key, { data: response.data, fetchedAt: Date.now() });
      setChapterDetails((previous) => ({
        ...previous,
        [key]: { data: response.data, loading: false },
      }));
    } catch (error) {
      if (controller.signal.aborted || inFlightRef.current.get(key) !== controller) return;
      setChapterDetails((previous) => ({
        ...previous,
        [key]: {
          data: previous[key]?.data,
          loading: false,
          error: getUserFacingErrorMessage(error, '获取章节任务点失败'),
        },
      }));
    } finally {
      if (inFlightRef.current.get(key) === controller) inFlightRef.current.delete(key);
    }
  }, [accountId, courseKey]);

  return { chapterDetails, loadChapter };
}
