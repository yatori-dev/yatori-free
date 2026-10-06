import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Tabs } from './ui/tabs';
import { changeView } from '@/lib/motion';

import {
  createTask,
  getCourses,
  getCourseDetails,
  getWorks,
  getExams,
  getVersion,
  getTasks,
  getUserFacingErrorMessage,
  isAuthExitError,
  stopTask,
} from '@/lib/api';
import type { AuthSession, CourseDetails, CourseSummary, Task, CoursesCustom, StudyIncrement, TaskTarget } from '@/lib/api';
import { notifyAuthExit } from '@/lib/notifications';
import { isActiveTaskStatus } from '@/lib/taskStatus';
import { useTaskProgressPolling } from '@/hooks/useTaskProgressPolling';
import { createCourseTaskPointProgressMap } from '@/lib/taskProgress';
import { hasReadTaskPoints } from '@/lib/courseChapters';
import { hasDeadlinePassed } from '@/lib/format';
import { getCourseNameMap, getTaskCounts } from '@/lib/dashboardDerived';
import { DashboardNavigation, type MobileDashboardTabId } from './dashboard/DashboardNavigation';
import { DashboardMainContent } from './dashboard/DashboardMainContent';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardOverlays } from './dashboard/DashboardOverlays';
import { toast } from 'sonner';
import { RequestCoordinator } from '@/lib/requestCoordinator';

interface DashboardProps {
  session: AuthSession;
  onLogout: () => void;
}

interface SettingsFormState {
  bypassDailyStudyLimit: boolean;
  showDeadlineBadges: boolean;
  workAutoSubmit: 0 | 1 | 2;
  examAutoSubmit: 0 | 1 | 2;
}

interface PersistedSettingsFormState {
  settingsVersion: number;
  showDeadlineBadges: boolean;
}

interface TaskExecutionSettingsState {
  bypassDailyStudyLimit: boolean;
  workAutoSubmit: 0 | 1 | 2;
  examAutoSubmit: 0 | 1 | 2;
}

interface PersistedSettingsState {
  accountId: string | null;
  form: PersistedSettingsFormState;
}

const TASK_SETTINGS_VERSION = 2;

const DEFAULT_PERSISTED_SETTINGS: PersistedSettingsFormState = {
  settingsVersion: TASK_SETTINGS_VERSION,
  showDeadlineBadges: true,
};

const DEFAULT_TASK_EXECUTION_SETTINGS: TaskExecutionSettingsState = {
  bypassDailyStudyLimit: false,
  workAutoSubmit: 0,
  examAutoSubmit: 0,
};

const DEFAULT_STUDY_INCREMENT: StudyIncrement = {
  visitCount: 0,
  videoStudyMinutes: 0,
  readMinutes: 0,
};

const TASK_SETTINGS_STORAGE_PREFIX = 'yatori-task-settings:';
function getTaskSettingsStorageKey(accountId: string) {
  return `${TASK_SETTINGS_STORAGE_PREFIX}${accountId}`;
}

function createDefaultPersistedSettingsFormState(): PersistedSettingsFormState {
  return { ...DEFAULT_PERSISTED_SETTINGS };
}

function createDefaultTaskExecutionSettingsState(): TaskExecutionSettingsState {
  return { ...DEFAULT_TASK_EXECUTION_SETTINGS };
}

function readPersistedSettings(accountId: string | null | undefined): PersistedSettingsFormState {
  if (!accountId) return createDefaultPersistedSettingsFormState();

  const raw = localStorage.getItem(getTaskSettingsStorageKey(accountId));
  if (!raw) {
    return createDefaultPersistedSettingsFormState();
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return createDefaultPersistedSettingsFormState();
    }

    const settings = parsed as Partial<PersistedSettingsFormState>;
    return {
      settingsVersion: TASK_SETTINGS_VERSION,
      showDeadlineBadges: settings.showDeadlineBadges !== false,
    };
  } catch (error) {
    console.error('Failed to parse task settings', error);
    localStorage.removeItem(getTaskSettingsStorageKey(accountId));
    return createDefaultPersistedSettingsFormState();
  }
}

export const Dashboard: React.FC<DashboardProps> = ({ session, onLogout }) => {
  const account = session.account;
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [appVersion, setAppVersion] = useState('...');
  const [activeTab, setActiveTab] = useState<MobileDashboardTabId>('courses');
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'active' | 'completed'>('active');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const dashboardMainRef = useRef<HTMLElement>(null);
  const mobileTabScrollPositions = useRef<Record<MobileDashboardTabId, number>>({
    courses: 0,
    works: 0,
    exams: 0,
    tasks: 0,
    settings: 0,
  });

  const handleTabChange = useCallback((tabId: MobileDashboardTabId) => {
    if (tabId === 'settings') {
      setSettingsDialogOpen(true);
      return;
    }

    setSettingsDialogOpen(false);

    if (tabId === activeTab) {
      return;
    }

    if (window.matchMedia('(max-width: 1023px)').matches) {
      mobileTabScrollPositions.current[activeTab] = dashboardMainRef.current?.scrollTop ?? 0;
    }

    if (tabId === 'tasks' && !tasks.some((task) => isActiveTaskStatus(task.status))) {
      setTaskFilter('completed');
    }

    changeView(() => {
      setActiveTab(tabId);
    }, 'dashboard');
  }, [activeTab, tasks]);

  useEffect(() => {
    if (!window.matchMedia('(max-width: 1023px)').matches) {
      return;
    }

    const main = dashboardMainRef.current;
    if (!main) {
      return;
    }

    main.scrollTop = mobileTabScrollPositions.current[activeTab];
  }, [activeTab]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const isActive = isActiveTaskStatus(task.status);
      if (taskFilter === 'active') return isActive;
      return !isActive;
    });
  }, [tasks, taskFilter]);

  const taskCounts = useMemo(() => getTaskCounts(tasks), [tasks]);

  const hasActiveTasks = useMemo(() => {
    return tasks.some(task => isActiveTaskStatus(task.status));
  }, [tasks]);

  const courseNameByIdentifier = useMemo(() => getCourseNameMap(courses), [courses]);

  const courseTaskPointProgressByIdentifier = useMemo(
    () => createCourseTaskPointProgressMap(courses),
    [courses],
  );

  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [selectedWorks, setSelectedWorks] = useState<Record<string, Set<string>>>({});
  const [selectedExams, setSelectedExams] = useState<Record<string, Set<string>>>({});
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [fullyExpandedCourseOutlines, setFullyExpandedCourseOutlines] = useState<Set<string>>(new Set());
  const [courseDetailsMap, setCourseDetailsMap] = useState<Record<string, CourseDetails>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [taskStartConfirmOpen, setTaskStartConfirmOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [stoppingTaskId, setStoppingTaskId] = useState<string | null>(null);
  const requestCoordinatorRef = useRef(new RequestCoordinator());
  const pendingDetailsRef = useRef(new Map<string, Promise<Awaited<ReturnType<typeof getCourseDetails>>>>());
  const accountIdRef = useRef(account?.id);

  

  const currentAccountId = account?.id ?? null;
  const [persistedSettingsState, setPersistedSettingsState] = useState<PersistedSettingsState>(() => ({
    accountId: currentAccountId,
    form: readPersistedSettings(currentAccountId),
  }));
  const [taskExecutionSettings, setTaskExecutionSettings] = useState<TaskExecutionSettingsState>(
    createDefaultTaskExecutionSettingsState,
  );
  const [studyIncrements, setStudyIncrements] = useState<Record<string, StudyIncrement>>({});
  const [studyIncrementCourseKey, setStudyIncrementCourseKey] = useState<string | null>(null);

  const persistedSettingsForm = persistedSettingsState.accountId === currentAccountId
    ? persistedSettingsState.form
    : readPersistedSettings(currentAccountId);
  const settingsForm: SettingsFormState = {
    ...persistedSettingsForm,
    ...taskExecutionSettings,
  };

  const {
    bypassDailyStudyLimit,
    showDeadlineBadges,
    workAutoSubmit,
    examAutoSubmit,
  } = settingsForm;

  const buildCoursesCustom = useCallback((overrides: Partial<CoursesCustom> = {}): CoursesCustom => {
    return {
      doChapterTest: true,
      doWork: false,
      workAutoSubmit: 0,
      doExam: false,
      examAutoSubmit: 0,
      includeCourses: [],
      excludeCourses: [],
      coursesSettings: [],
      ...overrides,
    };
  }, []);

  const studyIncrementCourse = useMemo(
    () => courses.find((course) => course.key === studyIncrementCourseKey) ?? null,
    [courses, studyIncrementCourseKey],
  );

  const studyIncrementCourseDetails = studyIncrementCourseKey
    ? courseDetailsMap[studyIncrementCourseKey]
    : undefined;

  const fetchCourses = useCallback(async () => {
    if (!account) return;
    const request = requestCoordinatorRef.current.begin('courses');
    setCoursesLoading(true);
    setCoursesError(null);
    try {
      const response = await getCourses(account.id, { signal: request.signal });
      if (!requestCoordinatorRef.current.isCurrent('courses', request.requestId)) return;
      const nextCourses = response.data.courses;
      setCourses(nextCourses);
      const [worksResult, examsResult] = await Promise.allSettled([
        getWorks(account.id, { signal: request.signal }),
        getExams(account.id, { signal: request.signal }),
      ]);
      if (!requestCoordinatorRef.current.isCurrent('courses', request.requestId)) return;
      const nextDetails: Record<string, CourseDetails> = {};
      if (worksResult.status === 'fulfilled') {
        const sourceError = worksResult.value.data.sourceStatus.joined === 'ok'
          ? undefined
          : '作业列表读取失败，请刷新重试';
        worksResult.value.data.courses.forEach(({ course, items, error }) => {
          nextDetails[course.key] = {
            course,
            works: items ?? [],
            ...((error ?? sourceError) ? { worksError: error ?? sourceError } : {}),
          };
        });
      } else {
        const detailResults = await Promise.allSettled(nextCourses.map((course) => getCourseDetails(account.id, course.key, { signal: request.signal })));
        detailResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const course = nextCourses[index];
            nextDetails[course.key] = {
              ...nextDetails[course.key],
              ...result.value.data,
              ...(result.value.data.works === undefined
                ? { worksError: getUserFacingErrorMessage(worksResult.reason, '作业列表读取失败，请刷新重试') }
                : {}),
            };
          }
        });
        nextCourses.forEach((course) => {
          nextDetails[course.key] ??= {
            course,
            works: [],
            worksError: getUserFacingErrorMessage(worksResult.reason, '作业列表读取失败，请刷新重试'),
          };
        });
      }
      if (examsResult.status === 'fulfilled') {
        const sourceError = examsResult.value.data.sourceStatus.joined === 'ok'
          ? undefined
          : '考试列表读取失败，请刷新重试';
        examsResult.value.data.courses.forEach(({ course, items, error }) => {
          nextDetails[course.key] = {
            ...(nextDetails[course.key] ?? { course }),
            exams: items ?? [],
            ...((error ?? sourceError) ? { examsError: error ?? sourceError } : {}),
          };
        });
      } else {
        nextCourses.forEach((course) => {
          const existing = nextDetails[course.key];
          nextDetails[course.key] = {
            ...(existing ?? { course }),
            ...(existing?.exams === undefined
              ? {
                  exams: [],
                  examsError: getUserFacingErrorMessage(examsResult.reason, '考试列表读取失败，请刷新重试'),
                }
              : {}),
          };
        });
      }
      setCourseDetailsMap((previous) => {
        const next = Object.fromEntries(nextCourses.map((course) => [course.key, {
          ...previous[course.key],
          ...nextDetails[course.key],
        }])) as Record<string, CourseDetails>;
        return next;
      });
      const processingCourseKeys = new Set(
        nextCourses.filter((course) => course.processing).map((course) => course.key),
      );
      if (processingCourseKeys.size > 0) {
        setSelectedCourses((prev) => {
          const next = new Set(prev);
          processingCourseKeys.forEach((courseKey) => next.delete(courseKey));
          return next;
        });
      }
    } catch (error) {
      if (isAuthExitError(error)) {
        notifyAuthExit(getUserFacingErrorMessage(error, '登录已失效，请重新登录'));
        onLogout();
        return;
      }
      console.error(error);
      const message = getUserFacingErrorMessage(error, '加载课程失败，请稍后重试');
      if (!(error instanceof Error && 'kind' in error && error.kind === 'aborted')) {
        setCoursesError(message);
        toast.error(message);
      }
    } finally {
      setCoursesLoading(false);
    }
  }, [account, onLogout]);

  const fetchTasks = useCallback(async (options: { showLoading?: boolean; notifyOnError?: boolean } = {}) => {
    const showLoading = options.showLoading ?? true;
    const notifyOnError = options.notifyOnError ?? showLoading;
    const request = requestCoordinatorRef.current.begin('tasks');
    if (showLoading) {
      setTasksLoading(true);
    }
    try {
      const response = await getTasks({ signal: request.signal });
      if (!requestCoordinatorRef.current.isCurrent('tasks', request.requestId)) return;
      setTasks(response.data.tasks);
    } catch (error) {
      if (isAuthExitError(error)) {
        notifyAuthExit(getUserFacingErrorMessage(error, '登录已失效，请重新登录'));
        onLogout();
        return;
      }
      console.error(error);
      if (notifyOnError && !(error instanceof Error && 'kind' in error && error.kind === 'aborted')) {
        toast.error(getUserFacingErrorMessage(error, '加载任务失败，请稍后重试'));
      }
    } finally {
      if (showLoading) {
        setTasksLoading(false);
      }
    }
  }, [onLogout]);

  useEffect(() => {
    if (accountIdRef.current === account?.id) return;
    requestCoordinatorRef.current.cancelAll();
    pendingDetailsRef.current.clear();
    setCourseDetailsMap({});
    setLoadingDetails({});
    setCourses([]);
    setTasks([]);
    accountIdRef.current = account?.id;
  }, [account?.id]);

  const handleToggleSelectWork = useCallback((classId: string, workId: string) => {
    setSelectedWorks((prev) => {
      const currentCourseSet = new Set(prev[classId] ?? []);
      if (currentCourseSet.has(workId)) {
        currentCourseSet.delete(workId);
      } else {
        currentCourseSet.add(workId);
      }
      return { ...prev, [classId]: currentCourseSet };
    });
  }, []);

  const handleToggleSelectCourseWorks = useCallback((classId: string) => {
    const details = courseDetailsMap[classId];
    const runnableWorks = details?.works?.filter((work) => work.runnable && !hasDeadlinePassed(work.endAt)) ?? [];
    if (runnableWorks.length === 0) return;

    setSelectedWorks((prev) => {
      const currentCourseSet = prev[classId] ?? new Set<string>();
      const allSelected = runnableWorks.every((w) => currentCourseSet.has(w.id));
      const nextCourseSet = allSelected ? new Set<string>() : new Set(runnableWorks.map((w) => w.id));
      return { ...prev, [classId]: nextCourseSet };
    });
  }, [courseDetailsMap]);

  const handleToggleSelectExam = useCallback((classId: string, examId: string) => {
    setSelectedExams((prev) => {
      const currentCourseSet = new Set(prev[classId] ?? []);
      if (currentCourseSet.has(examId)) {
        currentCourseSet.delete(examId);
      } else {
        currentCourseSet.add(examId);
      }
      return { ...prev, [classId]: currentCourseSet };
    });
  }, []);

  const handleToggleSelectCourseExams = useCallback((classId: string) => {
    const details = courseDetailsMap[classId];
    const runnableExams = details?.exams?.filter((exam) => exam.runnable && !hasDeadlinePassed(exam.endAt)) ?? [];
    if (runnableExams.length === 0) return;

    setSelectedExams((prev) => {
      const currentCourseSet = prev[classId] ?? new Set<string>();
      const allSelected = runnableExams.every((e) => currentCourseSet.has(e.id));
      const nextCourseSet = allSelected ? new Set<string>() : new Set(runnableExams.map((e) => e.id));
      return { ...prev, [classId]: nextCourseSet };
    });
  }, [courseDetailsMap]);

  const selectedWorksCount = useMemo(() => {
    return Object.values(selectedWorks).reduce((total, set) => total + set.size, 0);
  }, [selectedWorks]);

  const selectedExamsCount = useMemo(() => {
    return Object.values(selectedExams).reduce((total, set) => total + set.size, 0);
  }, [selectedExams]);

  const toggleCourseSelection = (courseKey: string) => {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseKey)) {
        next.delete(courseKey);
      } else {
        next.add(courseKey);
      }
      return next;
    });
  };

  const visibleCourses = courses;

  const filteredCourses = useMemo(() => {
    const query = courseSearchQuery.trim().toLocaleLowerCase();
    return query
      ? visibleCourses.filter((course) => course.courseName.toLocaleLowerCase().includes(query))
      : visibleCourses;
  }, [courseSearchQuery, visibleCourses]);

  const estimatedTaskDuration = useMemo(() => {
    if (selectedCourses.size === 0) return null;

    const selected = courses.filter((course) => selectedCourses.has(course.key));
    if (selected.length === 0 || selected.some((course) => (
      typeof course.jobCount !== 'number'
      || typeof course.jobFinishCount !== 'number'
      || course.jobCount <= 0
      || course.jobFinishCount >= course.jobCount
    ))) {
      return null;
    }

    const remainingTaskPoints = selected.reduce(
      (total, course) => total + Math.max(0, (course.jobCount ?? 0) - (course.jobFinishCount ?? 0)),
      0,
    );
    if (remainingTaskPoints <= 0) return null;

    const taskPointsPerHour = bypassDailyStudyLimit ? 180 : 50;
    const totalMinutes = Math.round((remainingTaskPoints / taskPointsPerHour) * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}分钟`;
    if (minutes === 0) return `${hours}小时`;
    return `${hours}小时${minutes}分钟`;
  }, [bypassDailyStudyLimit, courses, selectedCourses]);

  const toggleExpandCourse = (courseKey: string) => {
    if (expandedCourses.has(courseKey)) {
      setFullyExpandedCourseOutlines((previous) => {
        const next = new Set(previous);
        next.delete(courseKey);
        return next;
      });
    }

    setExpandedCourses(prev => {
      const next = new Set(prev);
      if (next.has(courseKey)) {
        next.delete(courseKey);
      } else {
        next.add(courseKey);
      }
      return next;
    });
    if (!courseDetailsMap[courseKey] || !courseDetailsMap[courseKey].chapters) {
      setLoadingDetails((previous) => ({ ...previous, [courseKey]: true }));
      const detailKey = `${account.id}:${courseKey}`;
      const pending = pendingDetailsRef.current.get(detailKey) ?? getCourseDetails(account.id, courseKey);
      pendingDetailsRef.current.set(detailKey, pending);
      void pending
        .then((response) => setCourseDetailsMap((previous) => ({
          ...previous,
          [courseKey]: {
            ...previous[courseKey],
            ...response.data,
            worksError: undefined,
            examsError: undefined,
          },
        })))
        .catch((error) => {
          if (isAuthExitError(error)) { notifyAuthExit(getUserFacingErrorMessage(error, '登录已失效，请重新登录')); onLogout(); }
          else toast.error(getUserFacingErrorMessage(error, '加载课程详情失败，请稍后重试'));
        })
        .finally(() => {
          if (pendingDetailsRef.current.get(detailKey) === pending) pendingDetailsRef.current.delete(detailKey);
          setLoadingDetails((previous) => ({ ...previous, [courseKey]: false }));
        });
    }
  };

  const toggleFullCourseOutline = (courseKey: string) => {
    setFullyExpandedCourseOutlines((previous) => {
      const next = new Set(previous);
      if (next.has(courseKey)) {
        next.delete(courseKey);
      } else {
        next.add(courseKey);
      }
      return next;
    });
  };

  const getSelectedProcessingCourses = (courseKeys: string[]) => {
    const courseKeySet = new Set(courseKeys);
    return courses.filter((course) => course.processing && courseKeySet.has(course.key));
  };

  const executeSubmitTask = async () => {
    if (!account) return;
    setCreatingTask(true);

    try {
      if (activeTab === 'works') {
        const targets: TaskTarget[] = Object.entries(selectedWorks)
          .filter(([, ids]) => ids.size > 0)
          .map(([classId, ids]) => ({ classId, itemIds: Array.from(ids) }));

        if (targets.length === 0) {
          toast.error('请先选择要执行的作业');
          return;
        }

        await createTask({
          accountId: account.id,
          kind: 'works',
          targets,
          coursesCustom: buildCoursesCustom({
            doWork: true,
            workAutoSubmit,
            includeCourses: targets.map((t) => t.classId),
          }),
        });

        toast.success('作业任务已启动');
        setSelectedWorks({});
        handleTabChange('tasks');
        setTaskFilter('active');
        void fetchTasks();
        void fetchCourses();
        return;
      }

      if (activeTab === 'exams') {
        const targets: TaskTarget[] = Object.entries(selectedExams)
          .filter(([, ids]) => ids.size > 0)
          .map(([classId, ids]) => ({ classId, itemIds: Array.from(ids) }));

        if (targets.length === 0) {
          toast.error('请先选择要执行的考试');
          return;
        }

        await createTask({
          accountId: account.id,
          kind: 'exams',
          targets,
          coursesCustom: buildCoursesCustom({
            doExam: true,
            examAutoSubmit,
            includeCourses: targets.map((t) => t.classId),
          }),
        });

        toast.success('考试任务已启动');
        setSelectedExams({});
        handleTabChange('tasks');
        setTaskFilter('active');
        void fetchTasks();
        void fetchCourses();
        return;
      }

      const includeCoursesList = Array.from(selectedCourses);
      const missingCourseKeys = includeCoursesList.filter((classId) => !courseDetailsMap[classId]?.taskPoints);
      const selectedCourseDetails = { ...courseDetailsMap };
      if (missingCourseKeys.length > 0) {
        const detailResults = await Promise.allSettled(
          missingCourseKeys.map((classId) => getCourseDetails(account.id, classId)),
        );
        detailResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const classId = missingCourseKeys[index];
            selectedCourseDetails[classId] = {
              ...selectedCourseDetails[classId],
              ...result.value.data,
            };
          }
        });
        setCourseDetailsMap((previous) => ({ ...previous, ...selectedCourseDetails }));
      }

      const targets: TaskTarget[] = includeCoursesList.flatMap((classId) => {
        const itemIds = (selectedCourseDetails[classId]?.taskPoints ?? [])
          .filter((taskPoint) => taskPoint.runnable)
          .map((taskPoint) => taskPoint.id);
        return itemIds.length > 0 ? [{ classId, itemIds }] : [];
      });

      if (targets.length === 0) {
        const hasIncompleteDetails = includeCoursesList.some((classId) => {
          const details = selectedCourseDetails[classId];
          return details?.incomplete === true || details?.taskPointsIncomplete === true;
        });
        toast.error(hasIncompleteDetails
          ? '课程任务点读取不完整，请刷新课程后重试'
          : '所选课程没有可执行的任务点，请刷新课程后重试');
        return;
      }

      const customConfig: CoursesCustom = buildCoursesCustom({
        includeCourses: includeCoursesList,
        excludeCourses: [],
        coursesSettings: includeCoursesList.flatMap((classId) => {
          const studyIncrement = studyIncrements[classId] ?? DEFAULT_STUDY_INCREMENT;
          const visitCount = studyIncrement.visitCount ?? 0;
          const videoStudyMinutes = studyIncrement.videoStudyMinutes ?? 0;
          const readMinutes = hasReadTaskPoints(selectedCourseDetails[classId]) ? (studyIncrement.readMinutes ?? 0) : 0;
          if (visitCount === 0 && videoStudyMinutes === 0 && readMinutes === 0) {
            return [];
          }

          return [{ classId, studyIncrement: { visitCount, videoStudyMinutes, readMinutes } }];
        }),
      });

      await createTask({
        accountId: account.id,
        kind: 'task_points',
        targets,
        bypassDailyStudyLimit,
        coursesCustom: customConfig,
      });

      toast.success('任务已启动');
      handleTabChange('tasks');
      setTaskFilter('active');
      void fetchTasks();
      void fetchCourses();
      setSelectedCourses(new Set());
      setTaskExecutionSettings((previous) => ({ ...previous, bypassDailyStudyLimit: false }));
      setStudyIncrements((previous) => {
        const next = { ...previous };
        includeCoursesList.forEach((classId) => delete next[classId]);
        return next;
      });
    } catch (error) {
      if (isAuthExitError(error)) {
        notifyAuthExit(getUserFacingErrorMessage(error, '登录已失效，请重新登录'));
        onLogout();
        return;
      }
      console.error(error);
      toast.error(getUserFacingErrorMessage(error, '创建任务失败，请稍后重试'));
    } finally {
      setCreatingTask(false);
    }
  };

  const createTaskWithSelection = async () => {
    if (!account) return;

    if (activeTab === 'works') {
      if (selectedWorksCount === 0) {
        toast.error('请先选择要执行的作业');
        return;
      }
    } else if (activeTab === 'exams') {
      if (selectedExamsCount === 0) {
        toast.error('请先选择要执行的考试');
        return;
      }
    } else {
      const includeCoursesList = Array.from(selectedCourses);

      if (includeCoursesList.length === 0) {
        toast.error('请先选择课程');
        return;
      }

      const processingCourses = getSelectedProcessingCourses(includeCoursesList);
      if (processingCourses.length > 0) {
        toast.error(`以下课程已有进行中的任务：${processingCourses.map((course) => course.courseName).join('、')}`);
        void fetchCourses();
        return;
      }
    }

    setTaskStartConfirmOpen(true);
  };

  const updateSettingSwitch = (key: 'bypassDailyStudyLimit' | 'showDeadlineBadges', checked: boolean) => {
    if (key === 'bypassDailyStudyLimit') {
      setTaskExecutionSettings((previous) => ({ ...previous, bypassDailyStudyLimit: checked }));
      return;
    }

    const nextForm = { ...persistedSettingsForm, [key]: checked };

    setPersistedSettingsState({
      accountId: currentAccountId,
      form: nextForm,
    });
  };

  const updateWorkAutoSubmit = (value: SettingsFormState['workAutoSubmit']) => {
    setTaskExecutionSettings((previous) => ({ ...previous, workAutoSubmit: value }));
  };

  const updateExamAutoSubmit = (value: SettingsFormState['examAutoSubmit']) => {
    setTaskExecutionSettings((previous) => ({ ...previous, examAutoSubmit: value }));
  };

  const saveStudyIncrement = (classId: string, value: StudyIncrement) => {
    setStudyIncrements((previous) => ({ ...previous, [classId]: value }));

    if (
      (value.visitCount ?? 0) > 0
      || (value.videoStudyMinutes ?? 0) > 0
      || (value.readMinutes ?? 0) > 0
    ) {
      setSelectedCourses((previous) => new Set(previous).add(classId));
    }
  };

  const handleStopTask = async (taskId: string) => {
    setStoppingTaskId(taskId);
    try {
      await stopTask(taskId);
      toast.info('已发送停止请求');
      void fetchTasks({ showLoading: false });
      void fetchCourses();
    } catch (error) {
      if (isAuthExitError(error)) {
        notifyAuthExit(getUserFacingErrorMessage(error, '登录已失效，请重新登录'));
        onLogout();
        return;
      }
      toast.error(getUserFacingErrorMessage(error, '停止任务失败，请稍后重试'));
    } finally {
      setStoppingTaskId(null);
    }
  };

  const handleTaskUnauthorized = useCallback(() => {
    notifyAuthExit();
    onLogout();
  }, [onLogout]);

  const taskSnapshots = useTaskProgressPolling({
    tasks,
    onUnauthorized: handleTaskUnauthorized,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchTasks();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchTasks]);

  useEffect(() => {
    if (account) {
      const timer = window.setTimeout(() => {
        void fetchCourses();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [account, fetchCourses]);

  useEffect(() => {
    if (!persistedSettingsState.accountId) {
      return;
    }

    localStorage.setItem(
      getTaskSettingsStorageKey(persistedSettingsState.accountId),
      JSON.stringify(persistedSettingsState.form),
    );
  }, [persistedSettingsState]);

  useEffect(() => {
    if (!account || !hasActiveTasks) {
      return;
    }

    const timer = setInterval(() => {
      void fetchTasks({ showLoading: false, notifyOnError: false });
    }, 15000);
    return () => clearInterval(timer);
  }, [account, fetchTasks, hasActiveTasks]);

  useEffect(() => {
    let cancelled = false;

    getVersion()
      .then((response) => {
        if (!cancelled) {
          setAppVersion(response.data.version.replace(/^v+/i, ''));
        }
      })
      .catch((error) => {
        console.error('Failed to load version', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const overlaySelectedCount = activeTab === 'works'
    ? selectedWorksCount
    : activeTab === 'exams'
      ? selectedExamsCount
      : activeTab === 'courses'
        ? selectedCourses.size
        : 0;

  const overlaySubmitButtonText = activeTab === 'works'
    ? `开始作答(${selectedWorksCount})`
    : activeTab === 'exams'
      ? `开始作答(${selectedExamsCount})`
      : `开始章节任务(${selectedCourses.size})`;

  const taskStartSummary = activeTab === 'works'
    ? `将开始处理 ${selectedWorksCount} 份作业，完成后${workAutoSubmit === 1 ? '自动提交' : '仅保存答案'}`
    : activeTab === 'exams'
      ? `将开始处理 ${selectedExamsCount} 场考试，完成后${examAutoSubmit === 1 ? '自动提交' : '仅保存答案'}`
      : `将开始处理 ${selectedCourses.size} 门课程的章节任务`;

  const currentHour = new Date().getHours();
  const taskStartWarnings = [
    currentHour >= 23 || currentHour < 7 ? '当前为夜间时段，任务进度可能被学习通打回' : null,
    activeTab === 'courses' && bypassDailyStudyLimit ? '已启用暴力模式，存在进度被检测并打回的风险' : null,
    activeTab === 'exams' && examAutoSubmit === 1 ? '考试答完后将直接提交，提交后通常无法修改' : null,
  ].filter((warning): warning is string => warning !== null);

  return (
    <div className="motion-view-enter relative flex h-svh min-h-svh flex-col overflow-hidden bg-background font-sans text-foreground lg:grid lg:h-screen lg:min-h-0 lg:grid-cols-[auto_minmax(0,1fr)]">
      <a href="#dashboard-main" className="sr-only z-[60] rounded-[var(--radius-md)] bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        跳到主内容
      </a>
      <Tabs
        value={activeTab}
        onValueChange={(value: string) => handleTabChange(value as MobileDashboardTabId)}
        className="contents"
      >
        <DashboardNavigation
          mode="desktop"
          collapsed={sidebarCollapsed}
          activeTab={settingsDialogOpen ? 'settings' : activeTab}
          activeTaskCount={taskCounts.active}
          appVersion={appVersion}
          onTabChange={handleTabChange}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <DashboardHeader
            appVersion={appVersion}
            session={session}
            accountMenuOpen={accountMenuOpen}
            sidebarCollapsed={sidebarCollapsed}
            onSidebarToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
            taskCounts={taskCounts}
            tasks={tasks}
            filteredTasks={filteredTasks}
            taskFilter={taskFilter}
            tasksLoading={tasksLoading}
            taskSnapshots={taskSnapshots}
            courseNameByIdentifier={courseNameByIdentifier}
            courseTaskPointProgressByIdentifier={courseTaskPointProgressByIdentifier}
            onAccountMenuChange={setAccountMenuOpen}
            onTaskFilterChange={setTaskFilter}
            onRefreshTasks={() => void fetchTasks()}
            onStopTask={handleStopTask}
            onLogoutRequest={() => setLogoutConfirmOpen(true)}
          />
          <DashboardMainContent
            mainRef={dashboardMainRef}
            activeTab={activeTab}
            accountId={account?.id}
            courses={courses}
            filteredCourses={filteredCourses}
            coursesLoading={coursesLoading}
            coursesError={coursesError}
            courseSearch={courseSearch}
            courseSearchQuery={courseSearchQuery}
            selectedCourses={selectedCourses}
            selectedWorks={selectedWorks}
            selectedExams={selectedExams}
            expandedCourses={expandedCourses}
            fullyExpandedCourseOutlines={fullyExpandedCourseOutlines}
            courseDetailsMap={courseDetailsMap}
            loadingDetails={loadingDetails}
            stoppingTaskId={stoppingTaskId}
            tasks={tasks}
            taskFilter={taskFilter}
            tasksLoading={tasksLoading}
            taskSnapshots={taskSnapshots}
            courseNameByIdentifier={courseNameByIdentifier}
            courseTaskPointProgressByIdentifier={courseTaskPointProgressByIdentifier}
            showDeadlineBadges={showDeadlineBadges}
            workAutoSubmit={workAutoSubmit}
            examAutoSubmit={examAutoSubmit}
            onRefreshCourses={fetchCourses}
            onSearchChange={setCourseSearch}
            onSearchQueryChange={setCourseSearchQuery}
            onToggleCourseSelection={toggleCourseSelection}
            onStopTask={handleStopTask}
            onToggleExpandCourse={toggleExpandCourse}
            onToggleFullCourseOutline={toggleFullCourseOutline}
            onTaskFilterChange={setTaskFilter}
            onRefreshTasks={() => void fetchTasks()}
            onWorkAutoSubmitChange={updateWorkAutoSubmit}
            onExamAutoSubmitChange={updateExamAutoSubmit}
            onTabChange={handleTabChange}
            onToggleSelectWork={handleToggleSelectWork}
            onToggleSelectCourseWorks={handleToggleSelectCourseWorks}
            onToggleSelectExam={handleToggleSelectExam}
            onToggleSelectCourseExams={handleToggleSelectCourseExams}
          />
        </div>
      </Tabs>


      <DashboardOverlays
        selectedCount={overlaySelectedCount}
        submitButtonText={overlaySubmitButtonText}
        creatingTask={creatingTask}
        estimatedTaskDuration={activeTab === 'courses' ? estimatedTaskDuration : null}
        taskStartConfirmOpen={taskStartConfirmOpen}
        taskStartSummary={taskStartSummary}
        taskStartWarnings={taskStartWarnings}
        logoutConfirmOpen={logoutConfirmOpen}
        settingsDialogOpen={settingsDialogOpen}
        bypassDailyStudyLimit={bypassDailyStudyLimit}
        showDeadlineBadges={showDeadlineBadges}
        studyIncrementCourseKey={studyIncrementCourseKey}
        studyIncrementCourse={studyIncrementCourse}
        studyIncrementCourseDetails={studyIncrementCourseDetails}
        loadingDetails={loadingDetails}
        studyIncrements={studyIncrements}
        onCreateTask={createTaskWithSelection}
        onTaskStartConfirmChange={setTaskStartConfirmOpen}
        onLogoutConfirmChange={setLogoutConfirmOpen}
        onSettingsDialogChange={setSettingsDialogOpen}
        onSettingSwitch={updateSettingSwitch}
        onExecuteSubmitTask={executeSubmitTask}
        onStudyIncrementOpenChange={(open) => { if (!open) setStudyIncrementCourseKey(null); }}
        onSaveStudyIncrement={saveStudyIncrement}
        onLogout={() => { setLogoutConfirmOpen(false); onLogout(); }}
      />
      <DashboardNavigation
        mode="mobile"
        activeTab={settingsDialogOpen ? 'settings' : activeTab}
        activeTaskCount={taskCounts.active}
        onTabChange={handleTabChange}
      />
    </div>
  );
};
