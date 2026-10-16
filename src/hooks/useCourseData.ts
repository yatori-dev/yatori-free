import { useCallback, useEffect, useRef, useState } from 'react';
import { getCourses, getCourseOutline, getWorks, getExams, getUserFacingErrorMessage, isAuthExitError, type CourseDetails, type CourseSummary } from '@/lib/api';
import { RequestCoordinator } from '@/lib/requestCoordinator';

const CACHE_TTL = 60_000;
type ListKind = 'works' | 'exams';

function isAborted(error: unknown) {
  return error instanceof Error && 'kind' in error && error.kind === 'aborted';
}

export function useCourseData(accountId: string, onUnauthorized: () => void) {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [courseDetailsMap, setCourseDetailsMap] = useState<Record<string, CourseDetails>>({});
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState<Record<ListKind, boolean>>({ works: false, exams: false });
  const [listErrors, setListErrors] = useState<Record<ListKind, string | null>>({ works: null, exams: null });
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const [detailRevisions, setDetailRevisions] = useState<Record<string, number>>({});
  const coordinator = useRef(new RequestCoordinator());
  const outlineTimes = useRef(new Map<string, number>());
  const listTimes = useRef(new Map<ListKind, number>());
  const inFlight = useRef(new Set<string>());

  useEffect(() => {
    const requests = coordinator.current;
    const outlines = outlineTimes.current;
    const lists = listTimes.current;
    const pending = inFlight.current;
    return () => {
      requests.cancelAll();
      outlines.clear();
      lists.clear();
      pending.clear();
    };
  }, [accountId]);

  const fetchCourses = useCallback(async (refresh = false) => {
    const request = coordinator.current.begin('courses');
    setCoursesLoading(true);
    setCoursesError(null);
    try {
      const response = await getCourses(accountId, { signal: request.signal, refresh });
      if (!coordinator.current.isCurrent('courses', request.requestId)) return;
      setCourses(response.data.courses);
      if (refresh) {
        outlineTimes.current.clear();
        listTimes.current.clear();
      }
      return response.data.courses;
    } catch (error) {
      if (!coordinator.current.isCurrent('courses', request.requestId) || isAborted(error)) return;
      if (isAuthExitError(error)) onUnauthorized();
      else setCoursesError(getUserFacingErrorMessage(error, '加载课程失败，请重试'));
    } finally {
      if (coordinator.current.finish('courses', request.requestId)) setCoursesLoading(false);
    }
  }, [accountId, onUnauthorized]);

  const fetchTaskList = useCallback(async (kind: ListKind, refresh = false) => {
    if (!refresh && (inFlight.current.has(kind) || Date.now() - (listTimes.current.get(kind) ?? 0) < CACHE_TTL)) return;
    const request = coordinator.current.begin(kind);
    inFlight.current.add(kind);
    setListLoading((previous) => ({ ...previous, [kind]: true }));
    setListErrors((previous) => ({ ...previous, [kind]: null }));
    try {
      const options = { signal: request.signal, refresh };
      const response = kind === 'works' ? await getWorks(accountId, options) : await getExams(accountId, options);
      if (!coordinator.current.isCurrent(kind, request.requestId)) return;
      if (response.data.sourceStatus.joined !== 'ok') {
        setListErrors((previous) => ({ ...previous, [kind]: `${kind === 'works' ? '作业' : '考试'}列表读取失败，请刷新重试` }));
        return;
      }
      const hasErrors = response.data.courses.some((item) => Boolean(item.error));
      if (!hasErrors) listTimes.current.set(kind, Date.now());
      setCourseDetailsMap((previous) => {
        const next = { ...previous };
        for (const course of courses) {
          next[course.key] = { ...next[course.key], course, [kind]: [], [`${kind}Error`]: undefined };
        }
        for (const { course, items, error } of response.data.courses) {
          next[course.key] = { ...next[course.key], course, [kind]: items ?? [], [`${kind}Error`]: error };
        }
        return next;
      });
    } catch (error) {
      if (!coordinator.current.isCurrent(kind, request.requestId) || isAborted(error)) return;
      if (isAuthExitError(error)) onUnauthorized();
      else setListErrors((previous) => ({ ...previous, [kind]: getUserFacingErrorMessage(error, `加载${kind === 'works' ? '作业' : '考试'}失败，请重试`) }));
    } finally {
      if (coordinator.current.finish(kind, request.requestId)) {
        inFlight.current.delete(kind);
        setListLoading((previous) => ({ ...previous, [kind]: false }));
      }
    }
  }, [accountId, courses, onUnauthorized]);

  const fetchOutline = useCallback(async (courseKey: string, refresh = false) => {
    const key = `outline:${courseKey}`;
    if (!refresh && (inFlight.current.has(key) || Date.now() - (outlineTimes.current.get(courseKey) ?? 0) < CACHE_TTL)) return;
    const request = coordinator.current.begin(key);
    inFlight.current.add(key);
    setLoadingDetails((previous) => ({ ...previous, [courseKey]: true }));
    setDetailErrors((previous) => ({ ...previous, [courseKey]: '' }));
    try {
      const response = await getCourseOutline(accountId, courseKey, { signal: request.signal, refresh });
      if (!coordinator.current.isCurrent(key, request.requestId)) return;
      if (!response.data.incomplete) outlineTimes.current.set(courseKey, Date.now());
      setCourseDetailsMap((previous) => ({ ...previous, [courseKey]: {
        ...previous[courseKey],
        ...response.data,
        works: previous[courseKey]?.works,
        exams: previous[courseKey]?.exams,
        worksError: previous[courseKey]?.worksError,
        examsError: previous[courseKey]?.examsError,
        taskPoints: undefined,
        documents: undefined,
      } }));
      setDetailRevisions((previous) => ({ ...previous, [courseKey]: (previous[courseKey] ?? 0) + 1 }));
    } catch (error) {
      if (!coordinator.current.isCurrent(key, request.requestId) || isAborted(error)) return;
      if (isAuthExitError(error)) onUnauthorized();
      else setDetailErrors((previous) => ({ ...previous, [courseKey]: getUserFacingErrorMessage(error, '加载章节失败，请重试') }));
    } finally {
      if (coordinator.current.finish(key, request.requestId)) {
        inFlight.current.delete(key);
        setLoadingDetails((previous) => ({ ...previous, [courseKey]: false }));
      }
    }
  }, [accountId, onUnauthorized]);

  return { courses, courseDetailsMap, setCourseDetailsMap, coursesLoading, coursesError, listLoading, listErrors, loadingDetails, detailErrors, detailRevisions, fetchCourses, fetchTaskList, fetchOutline };
}
