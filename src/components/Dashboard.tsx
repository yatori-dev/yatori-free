import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent } from './ui/tabs';

import {
  createTask,
  getCourseDetails,
  getCourses,
  getVersion,
  getTasks,
  getUserFacingErrorMessage,
  isAuthExitError,
  stopTask,
} from '@/lib/api';
import type { AuthSession, CourseDetails, CourseSummary, Task, CoursesCustom, StudyIncrement } from '@/lib/api';
import { notifyAuthExit } from '@/lib/notifications';
import { hasActiveStoredSignMonitor } from '@/lib/signMonitor';
import { isActiveTaskStatus } from '@/lib/taskStatus';
import { useTaskProgressPolling } from '@/hooks/useTaskProgressPolling';
import { createCourseTaskPointProgressMap } from '@/lib/taskProgress';
import { courseHasTaskPoints } from '@/lib/coursePresentation';
import { YATORI_REPOSITORY_URL } from '@/lib/externalLinks';
import { DashboardNavigation, type MobileDashboardTabId } from './dashboard/DashboardNavigation';
import { mobileDashboardTabOrder } from './dashboard/dashboardNavigationData';
import { TaskStatusContent } from './dashboard/TaskStatusContent';
import { TaskStatusDrawer } from './dashboard/TaskStatusDrawer';
import { TaskStatusTrigger } from './dashboard/TaskStatusTrigger';
import { SignMonitor } from './SignMonitor';
import { StudyIncrementSettings } from './StudyIncrementSettings';
import { OpenSourceDialog } from './OpenSourceDialog';
import { BrandMark } from './BrandMark';
import { NightTaskConfirmDialog } from './dashboard/NightTaskConfirmDialog';
import { LogoutConfirmDialog } from './dashboard/LogoutConfirmDialog';
import { TaskSettingsPanel } from './dashboard/TaskSettingsPanel';
import { CourseListSection } from './dashboard/CourseListSection';
import { 
  LogOut, 
  Play, 
  RefreshCw,
  Sun, 
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

interface DashboardProps {
  session: AuthSession;
  onLogout: () => void;
}

interface SettingsFormState {
  hideEmptyTaskCourses: boolean;
  doChapterTest: boolean;
  doWork: boolean;
  workAutoSubmit: 0 | 1 | 2;
  doExam: boolean;
  examAutoSubmit: 0 | 1 | 2;
}

interface PersistedSettingsFormState {
  settingsVersion: number;
  hideEmptyTaskCourses: boolean;
  doChapterTest: boolean;
}

interface TaskExecutionSettingsState {
  doWork: boolean;
  workAutoSubmit: 0 | 1 | 2;
  doExam: boolean;
  examAutoSubmit: 0 | 1 | 2;
}

interface PersistedSettingsState {
  accountId: string | null;
  form: PersistedSettingsFormState;
}

const TASK_SETTINGS_VERSION = 1;

const DEFAULT_PERSISTED_SETTINGS: PersistedSettingsFormState = {
  settingsVersion: TASK_SETTINGS_VERSION,
  hideEmptyTaskCourses: true,
  doChapterTest: true,
};

const DEFAULT_TASK_EXECUTION_SETTINGS: TaskExecutionSettingsState = {
  doWork: false,
  workAutoSubmit: 0,
  doExam: false,
  examAutoSubmit: 0,
};

const DEFAULT_STUDY_INCREMENT: StudyIncrement = {
  visitCount: 0,
  videoStudyMinutes: 0,
  readMinutes: 0,
};

const TASK_SETTINGS_STORAGE_PREFIX = 'yatori-task-settings:';
const THEME_STORAGE_KEY = 'yatori-theme';

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
    const isCurrentSettingsVersion = settings.settingsVersion === TASK_SETTINGS_VERSION;

    return {
      settingsVersion: TASK_SETTINGS_VERSION,
      hideEmptyTaskCourses: isCurrentSettingsVersion ? settings.hideEmptyTaskCourses !== false : true,
      doChapterTest: settings.doChapterTest !== false,
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
  const [signMonitorActive, setSignMonitorActive] = useState(() => hasActiveStoredSignMonitor(account.id));
  const [appVersion, setAppVersion] = useState('...');
  const [activeTab, setActiveTab] = useState<MobileDashboardTabId>('courses');
  const [prevTab, setPrevTab] = useState<MobileDashboardTabId>('courses');
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'active' | 'completed'>('active');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const dashboardMainRef = useRef<HTMLElement>(null);
  const mobileTabAnimationRef = useRef<Animation | null>(null);
  const mobileTabDirectionRef = useRef(1);
  const lastAnimatedMobileTabRef = useRef<MobileDashboardTabId>('courses');
  const mobileTabScrollPositions = useRef<Record<MobileDashboardTabId, number>>({
    courses: 0,
    sign: 0,
    tasks: 0,
    settings: 0,
  });

  const handleTabChange = useCallback((tabId: MobileDashboardTabId) => {
    if (tabId === activeTab) {
      return;
    }

    if (window.matchMedia('(max-width: 1023px)').matches) {
      mobileTabScrollPositions.current[activeTab] = dashboardMainRef.current?.scrollTop ?? 0;
      mobileTabDirectionRef.current = mobileDashboardTabOrder.indexOf(tabId) >= mobileDashboardTabOrder.indexOf(activeTab) ? 1 : -1;
    }

    setPrevTab(activeTab);
    setActiveTab(tabId);
  }, [activeTab]);

  useEffect(() => {
    if (!window.matchMedia('(max-width: 1023px)').matches) {
      return;
    }

    const main = dashboardMainRef.current;
    if (!main) {
      return;
    }

    main.scrollTop = mobileTabScrollPositions.current[activeTab];

    if (lastAnimatedMobileTabRef.current === activeTab) {
      return;
    }
    lastAnimatedMobileTabRef.current = activeTab;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof main.animate !== 'function') {
      return;
    }

    mobileTabAnimationRef.current?.cancel();
    const animation = main.animate(
      [
        {
          opacity: 0.82,
          transform: `translate3d(${mobileTabDirectionRef.current * 10}px, 0, 0) scale(0.995)`,
        },
        { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
      ],
      {
        duration: 210,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        fill: 'both',
      },
    );
    mobileTabAnimationRef.current = animation;

    return () => {
      animation.cancel();
      if (mobileTabAnimationRef.current === animation) {
        mobileTabAnimationRef.current = null;
      }
    };
  }, [activeTab]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const isActive = isActiveTaskStatus(task.status);
      if (taskFilter === 'active') return isActive;
      return !isActive;
    });
  }, [tasks, taskFilter]);

  const taskCounts = useMemo(() => {
    return tasks.reduce(
      (counts, task) => {
        if (isActiveTaskStatus(task.status)) {
          counts.active += 1;
        } else {
          counts.completed += 1;
        }

        return counts;
      },
      { active: 0, completed: 0 },
    );
  }, [tasks]);

  const hasActiveTasks = useMemo(() => {
    return tasks.some(task => isActiveTaskStatus(task.status));
  }, [tasks]);

  const courseNameByIdentifier = useMemo(() => {
    return courses.reduce<Record<string, string>>((map, course) => {
      const courseName = course.courseName?.trim();
      if (!courseName) return map;

      map[course.key] = courseName;
      if (course.courseId) {
        map[course.courseId] = courseName;
      }

      return map;
    }, {});
  }, [courses]);

  const courseTaskPointProgressByIdentifier = useMemo(
    () => createCourseTaskPointProgressMap(courses),
    [courses],
  );

  // Selection and Expandable Course Detail States
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [fullyExpandedCourseOutlines, setFullyExpandedCourseOutlines] = useState<Set<string>>(new Set());
  const [courseDetailsMap, setCourseDetailsMap] = useState<Record<string, CourseDetails>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [nightConfirmOpen, setNightConfirmOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  
  // Loading flags
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [stoppingTaskId, setStoppingTaskId] = useState<string | null>(null);

  // Logs viewer active state
  

  // Settings form states
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

  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const toggleDarkMode = () => {
    setTheme(isDark ? 'light' : 'dark');
    localStorage.removeItem(THEME_STORAGE_KEY);
  };

  const persistedSettingsForm = persistedSettingsState.accountId === currentAccountId
    ? persistedSettingsState.form
    : readPersistedSettings(currentAccountId);
  const settingsForm: SettingsFormState = {
    ...persistedSettingsForm,
    ...taskExecutionSettings,
  };

  const {
    hideEmptyTaskCourses,
    doChapterTest,
    doWork,
    workAutoSubmit,
    doExam,
    examAutoSubmit,
  } = settingsForm;

  const buildCoursesCustom = useCallback((overrides: Partial<CoursesCustom> = {}) => {
    return {
      doChapterTest,
      doWork,
      workAutoSubmit: doWork ? workAutoSubmit : 0,
      doExam,
      examAutoSubmit: doExam ? examAutoSubmit : 0,
      includeCourses: [],
      excludeCourses: [],
      coursesSettings: [],
      ...overrides,
    };
  }, [doChapterTest, doExam, doWork, examAutoSubmit, workAutoSubmit]);

  const studyIncrementCourse = useMemo(
    () => courses.find((course) => course.key === studyIncrementCourseKey) ?? null,
    [courses, studyIncrementCourseKey],
  );

  const studyIncrementCourseDetails = studyIncrementCourseKey
    ? courseDetailsMap[studyIncrementCourseKey]
    : undefined;

  const fetchCourses = useCallback(async () => {
    if (!account) return;
    setCoursesLoading(true);
    try {
      const response = await getCourses(account.id);
      const nextCourses = response.data.courses;
      setCourses(nextCourses);
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
      toast.error(getUserFacingErrorMessage(error, '加载课程失败，请稍后重试'));
    } finally {
      setCoursesLoading(false);
    }
  }, [account, onLogout]);

  const fetchTasks = useCallback(async (options: { showLoading?: boolean; notifyOnError?: boolean } = {}) => {
    const showLoading = options.showLoading ?? true;
    const notifyOnError = options.notifyOnError ?? showLoading;
    if (showLoading) {
      setTasksLoading(true);
    }
    try {
      const response = await getTasks();
      setTasks(response.data.tasks);
    } catch (error) {
      if (isAuthExitError(error)) {
        notifyAuthExit(getUserFacingErrorMessage(error, '登录已失效，请重新登录'));
        onLogout();
        return;
      }
      console.error(error);
      if (notifyOnError) {
        toast.error(getUserFacingErrorMessage(error, '加载任务失败，请稍后重试'));
      }
    } finally {
      if (showLoading) {
        setTasksLoading(false);
      }
    }
  }, [onLogout]);

  const loadCourseDetail = useCallback(async (classId: string) => {
    if (!account) return;
    setLoadingDetails(prev => ({ ...prev, [classId]: true }));
    try {
      const response = await getCourseDetails(account.id, classId);
      setCourseDetailsMap(prev => ({ ...prev, [classId]: response.data }));
    } catch (error) {
      if (isAuthExitError(error)) {
        notifyAuthExit(getUserFacingErrorMessage(error, '登录已失效，请重新登录'));
        onLogout();
        return;
      }
      console.error(error);
      toast.error(getUserFacingErrorMessage(error, '加载课程详情失败，请稍后重试'));
    } finally {
      setLoadingDetails(prev => ({ ...prev, [classId]: false }));
    }
  }, [account, onLogout]);



   const toggleCourseSelection = (courseKey: string) => {
    setSelectedCourses(prev => {
      const next = new Set(prev);
      if (next.has(courseKey)) {
        next.delete(courseKey);
      } else {
        next.add(courseKey);
      }
      return next;
    });
  };

  const visibleCourses = useMemo(() => {
    if (!hideEmptyTaskCourses) {
      return courses;
    }

    return courses.filter(courseHasTaskPoints);
  }, [courses, hideEmptyTaskCourses]);

  const filteredCourses = useMemo(() => {
    const query = courseSearchQuery.trim().toLocaleLowerCase();
    return query
      ? visibleCourses.filter((course) => course.courseName.toLocaleLowerCase().includes(query))
      : visibleCourses;
  }, [courseSearchQuery, visibleCourses]);

  const hiddenEmptyTaskCourseCount = courses.length - visibleCourses.length;
  const selectableCourses = filteredCourses.filter(course => !course.processing);
  const incompleteSelectableCourses = visibleCourses.filter((course) => {
    if (course.processing) return false;
    if (typeof course.jobCount !== 'number' || typeof course.jobFinishCount !== 'number') return false;
    return course.jobFinishCount < course.jobCount;
  });
  const isAllSelected = selectableCourses.length > 0 && selectableCourses.every(course => selectedCourses.has(course.key));
  const isSomeSelected = selectableCourses.length > 0 && selectableCourses.some(course => selectedCourses.has(course.key));
  const isAllIncompleteSelected = incompleteSelectableCourses.length > 0
    && incompleteSelectableCourses.every(course => selectedCourses.has(course.key));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCourses(prev => {
        const next = new Set(prev);
        selectableCourses.forEach(course => next.delete(course.key));
        return next;
      });
    } else {
      setSelectedCourses(prev => {
        const next = new Set(prev);
        selectableCourses.forEach(course => next.add(course.key));
        return next;
      });
    }
  };

  const handleToggleSelectIncomplete = () => {
    if (isAllIncompleteSelected) {
      setSelectedCourses((prev) => {
        const next = new Set(prev);
        incompleteSelectableCourses.forEach((course) => next.delete(course.key));
        return next;
      });
      return;
    }

    setSelectedCourses((prev) => {
      const next = new Set(prev);
      incompleteSelectableCourses.forEach((course) => next.add(course.key));
      return next;
    });
  };

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
        // Load details if not loaded
        const existingDetails = courseDetailsMap[courseKey];
        if (!existingDetails && !loadingDetails[courseKey]) {
          void loadCourseDetail(courseKey);
        }
      }
      return next;
    });
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

  const openStudyIncrementSettings = (classId: string) => {
    setStudyIncrementCourseKey(classId);
    if (!courseDetailsMap[classId] && !loadingDetails[classId]) {
      void loadCourseDetail(classId);
    }
  };

  const getSelectedProcessingCourses = (courseKeys: string[]) => {
    const courseKeySet = new Set(courseKeys);
    return courses.filter((course) => course.processing && courseKeySet.has(course.key));
  };

  const executeSubmitTask = async () => {
    if (!account) return;
    setCreatingTask(true);
    
    const includeCoursesList = Array.from(selectedCourses);
    const customConfig: CoursesCustom = buildCoursesCustom({
      includeCourses: includeCoursesList,
      excludeCourses: [],
      coursesSettings: includeCoursesList.flatMap((classId) => {
        const studyIncrement = studyIncrements[classId] ?? DEFAULT_STUDY_INCREMENT;
        const visitCount = studyIncrement.visitCount ?? 0;
        const videoStudyMinutes = studyIncrement.videoStudyMinutes ?? 0;
        const hasReadTaskPoints = courseDetailsMap[classId]?.hasReadTaskPoints === true;
        const readMinutes = hasReadTaskPoints ? (studyIncrement.readMinutes ?? 0) : 0;
        if (visitCount === 0 && videoStudyMinutes === 0 && readMinutes === 0) {
          return [];
        }

        return [{ classId, studyIncrement: { visitCount, videoStudyMinutes, readMinutes } }];
      }),
    });

    try {
      await createTask({
        accountId: account.id,
        coursesCustom: customConfig,
      });

      toast.success('任务已启动');
      if (window.matchMedia('(max-width: 1023px)').matches) {
        setTaskFilter('active');
        handleTabChange('tasks');
      } else {
        setTaskFilter('active');
        setTaskDrawerOpen(true);
      }
      void fetchTasks();
      void fetchCourses();
      setSelectedCourses(new Set());
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

    const hours = new Date().getHours();
    if (hours >= 23 || hours < 7) {
      setNightConfirmOpen(true);
      return;
    }

    void executeSubmitTask();
  };

  const updateSettingSwitch = (key: keyof SettingsFormState, checked: boolean) => {
    if (key === 'doWork' || key === 'doExam') {
      setTaskExecutionSettings((previous) => {
        const next = { ...previous, [key]: checked };
        if (key === 'doWork' && !checked) {
          next.workAutoSubmit = 0;
        }
        if (key === 'doExam' && !checked) {
          next.examAutoSubmit = 0;
        }
        return next;
      });
      return;
    }

    const nextForm = { ...persistedSettingsForm, [key]: checked };

    if (key === 'hideEmptyTaskCourses' && checked) {
      const visibleKeys = new Set(courses.filter(courseHasTaskPoints).map((course) => course.key));
      setSelectedCourses((prev) => {
        const next = new Set<string>();
        prev.forEach((courseKey) => {
          if (visibleKeys.has(courseKey)) {
            next.add(courseKey);
          }
        });
        return next.size === prev.size ? prev : next;
      });
    }

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
    const desktopMediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleDesktopTransition = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setActiveTab((currentTab) => currentTab === 'tasks' ? 'courses' : currentTab);
      }
    };

    desktopMediaQuery.addEventListener('change', handleDesktopTransition);
    return () => desktopMediaQuery.removeEventListener('change', handleDesktopTransition);
  }, []);

  // Keep the task list fresh only while unfinished tasks exist.
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
          setAppVersion(response.data.version);
        }
      })
      .catch((error) => {
        console.error('Failed to load version', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Tab transition calculations (fixed 10px displacement for calm navigation)
  const tabsList = mobileDashboardTabOrder;
  const prevIndex = tabsList.indexOf(prevTab);
  const currentIndex = tabsList.indexOf(activeTab);
  const tabSwitchDistance = Math.abs(currentIndex - prevIndex);
  const isMovingRight = currentIndex >= prevIndex;

  const translateVal = tabSwitchDistance === 0 ? 0 : 10;
  const startTranslateX = tabSwitchDistance === 0 ? '0px' : (isMovingRight ? `${translateVal}px` : `-${translateVal}px`);
  const durationMs = 260;

  const tabsStyle = {
    '--tab-transition-duration': `${durationMs}ms`,
    '--tab-transition-start-x': startTranslateX,
  } as React.CSSProperties;
  const desktopViewTitle = {
    courses: '课程列表',
    sign: '自动签到',
    tasks: '任务',
    settings: '提交设置',
  }[activeTab];

  return (
    <div className="relative flex h-screen min-h-screen h-svh min-h-svh flex-col overflow-hidden bg-background text-foreground font-sans lg:grid lg:h-screen lg:min-h-0 lg:grid-cols-[auto_minmax(0,1fr)]">
      <a href="#dashboard-main" className="sr-only z-[60] rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        跳到主内容
      </a>
      <Tabs
        value={activeTab}
        onValueChange={(value) => handleTabChange(value as MobileDashboardTabId)}
        className="contents"
        style={tabsStyle}
      >
        <DashboardNavigation
          mode="desktop"
          activeTab={activeTab}
          activeTaskCount={taskCounts.active}
          appVersion={appVersion}
          signMonitorActive={signMonitorActive}
          onTabChange={handleTabChange}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex min-h-14 items-center justify-between gap-1.5 border-b border-border bg-card px-2.5 py-1.5 shadow-sm sm:min-h-16 sm:gap-2 sm:px-6 sm:py-2.5 lg:px-8">
            <div className="flex min-w-0 shrink-0 items-center lg:hidden">
              <a
                href={YATORI_REPOSITORY_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-w-0 items-center gap-1.5 rounded-md font-semibold leading-none tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`在 GitHub 查看 Yatori 学习通服务 v${appVersion} 源码`}
              >
                <BrandMark className="text-xl sm:text-2xl" />
                <span className="flex flex-col gap-0.5 whitespace-nowrap">
                  <span className="text-[10px] font-semibold text-foreground/80 sm:text-sm">学习通服务</span>
                  <span className="text-[10px] font-medium tabular-nums text-muted-foreground sm:text-xs">v{appVersion}</span>
                </span>
              </a>
            </div>
            <h1 className="hidden min-w-0 truncate text-base font-semibold text-foreground lg:block">
              {desktopViewTitle}
            </h1>
            <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-4">
              <a
                href={YATORI_REPOSITORY_URL}
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:w-9 lg:hidden"
                aria-label="在 GitHub 查看 Yatori 学习通服务源码"
                title="GitHub"
              >
                <svg className="h-5 w-5" aria-hidden="true">
                  <use href="/icons.svg#github-icon" />
                </svg>
              </a>
              <OpenSourceDialog />
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleDarkMode}
                className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground sm:h-9 sm:w-9"
                aria-label={isDark ? '切换到浅色主题' : '切换到深色主题'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              <TaskStatusDrawer
                open={taskDrawerOpen}
                activeTaskCount={taskCounts.active}
                onOpenChange={setTaskDrawerOpen}
                trigger={<TaskStatusTrigger activeTaskCount={taskCounts.active} />}
              >
                <TaskStatusContent
                  tasks={tasks}
                  filteredTasks={filteredTasks}
                  taskCounts={taskCounts}
                  taskFilter={taskFilter}
                  tasksLoading={tasksLoading}
                  taskSnapshots={taskSnapshots}
                  courseNameByIdentifier={courseNameByIdentifier}
                  courseTaskPointProgressByIdentifier={courseTaskPointProgressByIdentifier}
                  onTaskFilterChange={setTaskFilter}
                  onRefresh={() => void fetchTasks()}
                  onStopTask={handleStopTask}
                />
              </TaskStatusDrawer>

              <div
                className="flex min-w-0 max-w-[154px] items-center gap-1 rounded-md border border-border bg-muted/40 py-0.5 pl-1 pr-1 min-[400px]:w-[clamp(132px,31vw,154px)] min-[400px]:gap-2 min-[400px]:py-1 min-[400px]:pl-1.5 min-[400px]:pr-1.5 sm:w-auto sm:max-w-none sm:gap-3 sm:pl-2 sm:pr-3"
                aria-label={`当前用户 ${session.displayName}`}
              >
            {session.avatarUrl ? (
              <img 
                src={session.avatarUrl} 
                alt="头像" 
                className="h-6 w-6 rounded-full object-cover ring-1 ring-border sm:h-7 sm:w-7"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground sm:h-7 sm:w-7 sm:text-xs">
                {session.displayName.substring(0, 1).toUpperCase()}
              </div>
            )}
            <div className="hidden min-w-0 flex-col text-left min-[360px]:flex min-[400px]:flex-1">
              <span className="max-w-[68px] truncate text-[11px] font-bold min-[400px]:max-w-none sm:max-w-[100px] sm:text-xs sm:font-semibold">{session.displayName}</span>
              <span className="hidden max-w-[100px] truncate text-xs text-muted-foreground sm:block">{session.user.username}</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLogoutConfirmOpen(true)}
              className="h-8 w-8 shrink-0 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground min-[400px]:ml-auto sm:ml-1 sm:h-6 sm:w-6"
              title="退出登录"
              aria-label="退出登录"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
            </div>
          </header>
          <div className="google-accent-bar lg:hidden">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <main ref={dashboardMainRef} id="dashboard-main" className="min-h-0 flex-1 overflow-x-clip overflow-y-auto pb-18 lg:pb-0">
            <div className="mx-auto w-full min-w-0 px-0 py-0 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 lg:py-6">
              <div className="min-w-0">
            <CourseListSection
              accountId={account?.id}
              courses={courses}
              filteredCourses={filteredCourses}
              coursesLoading={coursesLoading}
              courseSearch={courseSearch}
              courseSearchQuery={courseSearchQuery}
              selectableCourses={selectableCourses}
              incompleteSelectableCourses={incompleteSelectableCourses}
              isAllSelected={isAllSelected}
              isSomeSelected={isSomeSelected}
              isAllIncompleteSelected={isAllIncompleteSelected}
              selectedCourses={selectedCourses}
              expandedCourses={expandedCourses}
              fullyExpandedCourseOutlines={fullyExpandedCourseOutlines}
              courseDetailsMap={courseDetailsMap}
              loadingDetails={loadingDetails}
              stoppingTaskId={stoppingTaskId}
              studyIncrements={studyIncrements}
              defaultStudyIncrement={DEFAULT_STUDY_INCREMENT}
              onRefresh={fetchCourses}
              onSearchChange={setCourseSearch}
              onSearchQueryChange={setCourseSearchQuery}
              onToggleSelectAll={handleToggleSelectAll}
              onToggleSelectIncomplete={handleToggleSelectIncomplete}
              onToggleCourseSelection={toggleCourseSelection}
              onOpenStudyIncrementSettings={openStudyIncrementSettings}
              onStopTask={handleStopTask}
              onToggleExpandCourse={toggleExpandCourse}
              onToggleFullCourseOutline={toggleFullCourseOutline}
            />

            {/* Auto Sign-In Monitor tab content */}
            <TabsContent value="sign" className="m-0 outline-none">
              <Card className="rounded-none border-none bg-card py-0 shadow-none ring-0 sm:rounded-xl sm:py-4 sm:shadow-sm lg:py-0">
                <CardHeader className="rounded-none border-b border-border/50 px-3 py-2.5 sm:px-6 sm:py-4 lg:hidden">
                  <CardTitle className="text-sm font-semibold sm:text-base">自动签到</CardTitle>
                </CardHeader>
                <CardContent className="p-3 text-sm sm:p-6">
                  {account?.id && (
                    <SignMonitor
                      accountId={account.id}
                      onUnauthorized={onLogout}
                      onStatusChange={setSignMonitorActive}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="outline-none m-0">
              <TaskSettingsPanel
                hiddenEmptyTaskCourseCount={hiddenEmptyTaskCourseCount}
                hideEmptyTaskCourses={hideEmptyTaskCourses}
                doChapterTest={doChapterTest}
                doWork={doWork}
                workAutoSubmit={workAutoSubmit}
                doExam={doExam}
                examAutoSubmit={examAutoSubmit}
                onUnauthorized={onLogout}
                onSettingSwitch={updateSettingSwitch}
                onWorkAutoSubmitChange={updateWorkAutoSubmit}
                onExamAutoSubmitChange={updateExamAutoSubmit}
              />
            </TabsContent>

            <TabsContent value="tasks" className="m-0 outline-none lg:hidden">
              <Card className="min-w-0 overflow-hidden rounded-none border-none bg-card py-0 shadow-none ring-0 sm:rounded-xl sm:py-4 sm:shadow-sm sm:ring-0">
                <CardHeader className="rounded-none border-b border-border/50 px-3 py-2.5 sm:px-6 sm:py-4">
                  <CardTitle className="text-sm font-semibold sm:text-base">任务</CardTitle>
                  <CardDescription className="text-xs">查看任务运行状态与进度</CardDescription>
                </CardHeader>
                <CardContent className="flex min-h-0 min-w-0 flex-col p-0">
                  <TaskStatusContent
                    tasks={tasks}
                    filteredTasks={filteredTasks}
                    taskCounts={taskCounts}
                    taskFilter={taskFilter}
                    tasksLoading={tasksLoading}
                    taskSnapshots={taskSnapshots}
                    courseNameByIdentifier={courseNameByIdentifier}
                    courseTaskPointProgressByIdentifier={courseTaskPointProgressByIdentifier}
                    onTaskFilterChange={setTaskFilter}
                    onRefresh={() => void fetchTasks()}
                    onStopTask={handleStopTask}
                  />
                </CardContent>
              </Card>
            </TabsContent>
              </div>
            </div>
          </main>
        </div>
      </Tabs>


      {/* 提交任务悬浮按钮 */}
      {selectedCourses.size > 0 && (
        <div className="absolute bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 animate-bottom-bar-enter lg:bottom-6">
          <Button
            type="button"
            onClick={createTaskWithSelection}
            disabled={creatingTask}
            className="h-12 gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-floating ring-4 ring-card/80 hover:bg-primary-hover"
            title={`提交 ${selectedCourses.size} 门课程任务`}
            aria-label={`提交 ${selectedCourses.size} 门课程任务`}
          >
            {creatingTask ? (
              <RefreshCw className="h-[18px] w-[18px] animate-spin" aria-hidden="true" />
            ) : (
              <Play className="h-[18px] w-[18px] fill-current" aria-hidden="true" />
            )}
            <span>提交任务({selectedCourses.size})</span>
          </Button>
        </div>
      )}

      <NightTaskConfirmDialog
        open={nightConfirmOpen}
        onOpenChange={setNightConfirmOpen}
        onConfirm={executeSubmitTask}
      />
      <LogoutConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          onLogout();
        }}
      />

      <StudyIncrementSettings
        open={studyIncrementCourseKey !== null}
        onOpenChange={(open) => {
          if (!open) setStudyIncrementCourseKey(null);
        }}
        course={studyIncrementCourse}
        hasReadTaskPoints={studyIncrementCourseDetails?.hasReadTaskPoints === true}
        studyStats={studyIncrementCourseDetails?.studyStats}
        statsLoaded={studyIncrementCourseDetails !== undefined}
        loadingStats={studyIncrementCourseKey !== null && loadingDetails[studyIncrementCourseKey] === true}
        values={studyIncrements}
        onSave={saveStudyIncrement}
      />
      <DashboardNavigation
        mode="mobile"
        activeTab={activeTab}
        activeTaskCount={taskCounts.active}
        signMonitorActive={signMonitorActive}
        onTabChange={handleTabChange}
      />
    </div>
  );
};
