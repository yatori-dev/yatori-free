import React, { lazy, Suspense, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent } from './ui/tabs';
import { SidebarInset, SidebarProvider } from './ui/sidebar';

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
import { DashboardAccountMenu, DashboardNavigation, type MobileDashboardTabId } from './dashboard/DashboardNavigation';
import { mobileDashboardTabOrder } from './dashboard/dashboardNavigationData';
import { BrandMark } from './BrandMark';
import { OpenSourceDialog } from './OpenSourceDialog';
import { NightTaskConfirmDialog } from './dashboard/NightTaskConfirmDialog';
import { BypassDailyStudyLimitConfirmDialog } from './dashboard/BypassDailyStudyLimitConfirmDialog';
import { LogoutConfirmDialog } from './dashboard/LogoutConfirmDialog';
import { CourseListSection } from './dashboard/CourseListSection';
import { DashboardSummaryCards } from './dashboard/DashboardSummaryCards';
import {
  Play,
  RefreshCw,
  Sun, 
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { flushSync } from 'react-dom';

const SignMonitor = lazy(() => import('./SignMonitor').then((module) => ({ default: module.SignMonitor })));
const TaskStatusContent = lazy(() => import('./dashboard/TaskStatusContent').then((module) => ({ default: module.TaskStatusContent })));
const TaskSettingsPanel = lazy(() => import('./dashboard/TaskSettingsPanel').then((module) => ({ default: module.TaskSettingsPanel })));
const StudyIncrementSettings = lazy(() => import('./StudyIncrementSettings').then((module) => ({ default: module.StudyIncrementSettings })));

interface DashboardProps {
  session: AuthSession;
  onLogout: () => void;
}

interface SettingsFormState {
  hideEmptyTaskCourses: boolean;
  bypassDailyStudyLimit: boolean;
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
  bypassDailyStudyLimit: boolean;
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
  bypassDailyStudyLimit: false,
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
function getTaskSettingsStorageKey(accountId: string) {
  return `${TASK_SETTINGS_STORAGE_PREFIX}${accountId}`;
}

function DashboardViewFallback() {
  return (
    <div className="flex min-h-48 items-center justify-center" aria-busy="true">
      <RefreshCw className="size-6 animate-spin text-muted-foreground motion-reduce:animate-none" aria-label="正在加载页面" />
    </div>
  );
}

function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const themeAnimationRef = useRef<Animation | null>(null);
  const themeSwitchingRef = useRef(false);

  useEffect(() => () => {
    themeAnimationRef.current?.cancel();
    document.getElementById('root')?.style.removeProperty('opacity');
  }, []);

  const toggleDarkMode = () => {
    if (themeSwitchingRef.current) {
      return;
    }

    const nextTheme = isDark ? 'light' : 'dark';
    const applyTheme = () => {
      flushSync(() => setTheme(nextTheme));
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyTheme();
      return;
    }

    if (typeof document.startViewTransition === 'function') {
      document.activeViewTransition?.skipTransition();
      document.startViewTransition(applyTheme);
      return;
    }

    const appRoot = document.getElementById('root');
    if (!appRoot || typeof appRoot.animate !== 'function') {
      applyTheme();
      return;
    }

    themeSwitchingRef.current = true;
    const fadeOut = appRoot.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 90, easing: 'ease-out', fill: 'forwards' },
    );
    themeAnimationRef.current = fadeOut;

    void fadeOut.finished
      .then(() => {
        appRoot.style.opacity = '0';
        fadeOut.cancel();
        applyTheme();

        const fadeIn = appRoot.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: 90, easing: 'ease-out', fill: 'forwards' },
        );
        themeAnimationRef.current = fadeIn;
        return fadeIn.finished;
      })
      .catch(() => undefined)
      .finally(() => {
        appRoot.style.removeProperty('opacity');
        themeAnimationRef.current?.cancel();
        themeAnimationRef.current = null;
        themeSwitchingRef.current = false;
      });
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={toggleDarkMode}
      className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground sm:h-9 sm:w-9"
      aria-label={isDark ? '切换到浅色主题' : '切换到深色主题'}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </Button>
  );
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
  const [openSourceDialogOpen, setOpenSourceDialogOpen] = useState(false);
  const [submitBypassConfirmOpen, setSubmitBypassConfirmOpen] = useState(false);
  
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

  const persistedSettingsForm = persistedSettingsState.accountId === currentAccountId
    ? persistedSettingsState.form
    : readPersistedSettings(currentAccountId);
  const settingsForm: SettingsFormState = {
    ...persistedSettingsForm,
    ...taskExecutionSettings,
  };

  const {
    hideEmptyTaskCourses,
    bypassDailyStudyLimit,
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
        bypassDailyStudyLimit,
        coursesCustom: customConfig,
      });

      toast.success('任务已启动');
      setTaskFilter('active');
      handleTabChange('tasks');
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

    if (bypassDailyStudyLimit) {
      setSubmitBypassConfirmOpen(true);
      return;
    }

    void executeSubmitTask();
  };

  const confirmNightTask = () => {
    if (bypassDailyStudyLimit) {
      setSubmitBypassConfirmOpen(true);
      return;
    }

    void executeSubmitTask();
  };

  const updateSettingSwitch = (key: keyof SettingsFormState, checked: boolean) => {
    if (key === 'bypassDailyStudyLimit' || key === 'doWork' || key === 'doExam') {
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

  const desktopViewTitle = {
    courses: '课程列表',
    sign: '自动签到',
    tasks: '任务',
    settings: '提交设置',
  }[activeTab];

  return (
    <SidebarProvider className="relative h-svh min-h-svh overflow-hidden bg-background font-sans text-foreground" style={{ '--sidebar-width': '16rem' } as React.CSSProperties}>
      <a href="#dashboard-main" className="sr-only z-[60] rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        跳到主内容
      </a>
      <Tabs
        value={activeTab}
        onValueChange={(value) => handleTabChange(value as MobileDashboardTabId)}
        className="contents"
      >
        <DashboardNavigation
          mode="desktop"
          activeTab={activeTab}
          activeTaskCount={taskCounts.active}
          appVersion={appVersion}
          signMonitorActive={signMonitorActive}
          session={session}
          onTabChange={handleTabChange}
          onOpenSource={() => setOpenSourceDialogOpen(true)}
          onLogout={() => setLogoutConfirmOpen(true)}
          footerActions={(
            <ThemeToggleButton />
          )}
        />
        <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
          <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-4 lg:px-6">
            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              <BrandMark className="text-xl" />
              <span className="hidden text-xs text-muted-foreground min-[390px]:inline">学习通服务 · v{appVersion}</span>
            </div>
            <h1 className="hidden min-w-0 truncate text-base font-medium lg:block">{desktopViewTitle}</h1>
            <div className="ml-auto flex items-center gap-1">
              {activeTab === 'courses' && selectedCourses.size > 0 && (
                <Button
                  type="button"
                  onClick={createTaskWithSelection}
                  disabled={creatingTask}
                  className="hidden h-8 gap-2 bg-brand px-3 text-white hover:bg-brand/90 lg:inline-flex"
                >
                  {creatingTask ? <RefreshCw className="size-4 animate-spin" /> : <Play className="size-4 fill-current" />}
                  提交任务 ({selectedCourses.size})
                  {estimatedTaskDuration && <span className="text-white/70">约 {estimatedTaskDuration}</span>}
                </Button>
              )}
              <div className="lg:hidden"><ThemeToggleButton /></div>
              <div className="lg:hidden">
                <DashboardAccountMenu
                  session={session}
                  compact
                  onOpenSource={() => setOpenSourceDialogOpen(true)}
                  onLogout={() => setLogoutConfirmOpen(true)}
                />
              </div>
            </div>
          </header>
          <main ref={dashboardMainRef} id="dashboard-main" className="min-h-0 flex-1 overflow-x-clip overflow-y-auto pb-18 lg:pb-0">
            <div className="mx-auto flex w-full min-w-0 flex-col gap-4 sm:p-4 lg:gap-6 lg:p-6">
            {activeTab === 'courses' && (
              <DashboardSummaryCards
                courseCount={visibleCourses.length}
                pendingCourseCount={incompleteSelectableCourses.length}
                activeTaskCount={taskCounts.active}
                selectedCourseCount={selectedCourses.size}
              />
            )}
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

            <TabsContent value="sign" className="m-0 outline-none">
              <Card className="rounded-none border-x-0 shadow-xs sm:rounded-xl sm:border-x">
                <CardHeader className="border-b lg:hidden">
                  <CardTitle className="text-sm font-semibold sm:text-base">自动签到</CardTitle>
                </CardHeader>
                <CardContent className="p-3 text-sm sm:p-6">
                  {activeTab === 'sign' && account?.id && (
                    <Suspense fallback={<DashboardViewFallback />}>
                      <SignMonitor
                        accountId={account.id}
                        onUnauthorized={onLogout}
                        onStatusChange={setSignMonitorActive}
                      />
                    </Suspense>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="outline-none m-0">
              {activeTab === 'settings' && (
                <Suspense fallback={<DashboardViewFallback />}>
                  <TaskSettingsPanel
                    hiddenEmptyTaskCourseCount={hiddenEmptyTaskCourseCount}
                    hideEmptyTaskCourses={hideEmptyTaskCourses}
                    bypassDailyStudyLimit={bypassDailyStudyLimit}
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
                </Suspense>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="m-0 outline-none">
              <Card className="min-w-0 overflow-hidden rounded-none border-x-0 shadow-xs sm:rounded-xl sm:border-x">
                <CardHeader className="border-b">
                  <CardTitle className="text-sm font-semibold sm:text-base">任务</CardTitle>
                  <CardDescription className="text-xs">查看任务运行状态与进度</CardDescription>
                </CardHeader>
                <CardContent className="flex min-h-0 min-w-0 flex-col p-0">
                  {activeTab === 'tasks' && (
                    <Suspense fallback={<DashboardViewFallback />}>
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
                    </Suspense>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            </div>
          </main>
        </SidebarInset>
      </Tabs>

      {selectedCourses.size > 0 && activeTab === 'courses' && (
        <div className="absolute bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 animate-bottom-bar-enter lg:hidden">
          <div className="flex flex-col items-center gap-1">
            <Button
              type="button"
              onClick={createTaskWithSelection}
              disabled={creatingTask}
              className="h-11 gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-white shadow-floating ring-4 ring-background/80 hover:bg-brand/90"
              title={`提交 ${selectedCourses.size} 门课程任务`}
              aria-label={`提交 ${selectedCourses.size} 门课程任务`}
            >
              {creatingTask ? (
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              )}
              <span>提交任务({selectedCourses.size})</span>
            </Button>
            {estimatedTaskDuration && (
              <span className="whitespace-nowrap text-[11px] font-medium text-muted-foreground" role="status">
                预计所需{estimatedTaskDuration}
              </span>
            )}
          </div>
        </div>
      )}

      <NightTaskConfirmDialog
        open={nightConfirmOpen}
        onOpenChange={setNightConfirmOpen}
        onConfirm={confirmNightTask}
      />
      <BypassDailyStudyLimitConfirmDialog
        open={submitBypassConfirmOpen}
        onOpenChange={setSubmitBypassConfirmOpen}
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
      <OpenSourceDialog open={openSourceDialogOpen} onOpenChange={setOpenSourceDialogOpen} showTrigger={false} />

      <Suspense fallback={null}>
        {studyIncrementCourseKey !== null && (
          <StudyIncrementSettings
            open
            onOpenChange={(open) => {
              if (!open) setStudyIncrementCourseKey(null);
            }}
            course={studyIncrementCourse}
            hasReadTaskPoints={studyIncrementCourseDetails?.hasReadTaskPoints === true}
            studyStats={studyIncrementCourseDetails?.studyStats}
            statsLoaded={studyIncrementCourseDetails !== undefined}
            loadingStats={loadingDetails[studyIncrementCourseKey] === true}
            values={studyIncrements}
            onSave={saveStudyIncrement}
          />
        )}
      </Suspense>
      <DashboardNavigation
        mode="mobile"
        activeTab={activeTab}
        activeTaskCount={taskCounts.active}
        signMonitorActive={signMonitorActive}
        onTabChange={handleTabChange}
      />
    </SidebarProvider>
  );
};
