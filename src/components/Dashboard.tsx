import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Tabs, TabsContent } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

import {
  createTask,
  getCourseDocumentDownloadUrl,
  getCourseDetails,
  getCourses,
  getVersion,
  getTasks,
  getUserFacingErrorMessage,
  isAuthExitError,
  stopTask,
} from '@/lib/api';
import { extractChapterItems, getChapterDocuments, getChapterTaskMetas } from '@/lib/courseChapters';
import type { AuthSession, Course, CourseDetails, CourseDocument, Task, CoursesCustom, StudyIncrement } from '@/lib/api';
import { notifyAuthExit } from '@/lib/notifications';
import { hasActiveStoredSignMonitor } from '@/lib/signMonitor';
import { isActiveTaskStatus } from '@/lib/taskStatus';
import { useTaskProgressPolling } from '@/hooks/useTaskProgressPolling';
import { DashboardNavigation, type MobileDashboardTabId } from './dashboard/DashboardNavigation';
import { TaskStatusContent } from './dashboard/TaskStatusContent';
import { TaskStatusDrawer } from './dashboard/TaskStatusDrawer';
import { TaskStatusTrigger } from './dashboard/TaskStatusTrigger';
import { SignMonitor } from './SignMonitor';
import { StudyIncrementSettings } from './StudyIncrementSettings';
import { EmailNotificationSettings } from './EmailNotificationSettings';
import { OpenSourceDialog } from './OpenSourceDialog';
import { NightTaskConfirmDialog } from './dashboard/NightTaskConfirmDialog';
import { LogoutConfirmDialog } from './dashboard/LogoutConfirmDialog';
import { 
  LogOut, 
  Play, 
  Square,
  RefreshCw, 
  AlertCircle, 
  Sun, 
  Moon,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  SlidersHorizontal,
  Search,
  X,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

interface CourseCheckboxProps {
  checked: boolean;
  disabled?: boolean;
  indeterminate: boolean;
  onChange: () => void;
}

const CourseCheckbox: React.FC<CourseCheckboxProps> = ({ checked, disabled = false, indeterminate, onChange }) => {
  const ref = React.useRef<HTMLInputElement>(null);
  
  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className="w-4 h-4 rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8] dark:border-gray-600 dark:bg-[#2d2e30] accent-[#1a73e8] cursor-pointer shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
};

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

function courseHasTaskPoints(course: Course) {
  const hasKnownTaskCount = typeof course.jobCount === 'number' || typeof course.blockedPointCount === 'number';
  if (!hasKnownTaskCount) {
    return true;
  }

  return (course.jobCount ?? 0) > 0 || (course.blockedPointCount ?? 0) > 0;
}

function formatFileSize(size?: number) {
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

function getCourseDocumentTypeLabel(document: CourseDocument) {
  const extension = document.extension.trim().replace(/^\./, '').toUpperCase();
  return extension || document.type.toUpperCase();
}

function getCourseDocumentFileName(document: CourseDocument) {
  const extension = document.extension.trim().replace(/^\./, '');
  const name = document.name.trim();

  if (!extension || name.toLowerCase().endsWith(`.${extension.toLowerCase()}`)) {
    return name;
  }

  return `${name}.${extension}`;
}

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [signMonitorActive, setSignMonitorActive] = useState(() => hasActiveStoredSignMonitor(account.id));
  const [appVersion, setAppVersion] = useState('...');
  const [activeTab, setActiveTab] = useState<MobileDashboardTabId>('courses');
  const [prevTab, setPrevTab] = useState<MobileDashboardTabId>('courses');
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'active' | 'completed'>('active');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const isCourseSearchComposing = useRef(false);

  const handleTabChange = useCallback((tabId: MobileDashboardTabId) => {
    setPrevTab(activeTab);
    setActiveTab(tabId);
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
  const isAllSelected = selectableCourses.length > 0 && selectableCourses.every(course => selectedCourses.has(course.key));
  const isSomeSelected = selectableCourses.length > 0 && selectableCourses.some(course => selectedCourses.has(course.key));

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

  const clearSelection = () => {
    setSelectedCourses(new Set());
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
  const tabsList = ['courses', 'sign', 'tasks', 'settings'];
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
    <div className="min-h-screen bg-background text-foreground font-sans lg:grid lg:h-screen lg:min-h-0 lg:grid-cols-[auto_minmax(0,1fr)] lg:overflow-hidden">
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
        <div className="flex min-h-0 min-w-0 flex-col">
          <header className="sticky top-0 z-40 flex min-h-14 items-center justify-between gap-1.5 border-b border-border bg-card px-2.5 py-1.5 shadow-sm sm:min-h-16 sm:gap-2 sm:px-6 sm:py-2.5 lg:px-8">
            <div className="flex min-w-0 shrink-0 items-center lg:hidden">
              <div className="inline-flex min-w-0 items-center gap-1.5 font-semibold leading-none tracking-tight" aria-label={`Yatori 学习通服务 v${appVersion}`}>
                <span className="text-xl" aria-label="Yatori">
                  <span className="text-[var(--google-blue)]">Y</span>
                  <span className="text-[var(--google-red)]">a</span>
                  <span className="text-[var(--google-yellow)]">t</span>
                  <span className="text-[var(--google-blue)]">o</span>
                  <span className="text-[var(--google-green)]">r</span>
                  <span className="text-[var(--google-red)]">i</span>
                </span>
                <span className="flex flex-col gap-0.5 whitespace-nowrap">
                  <span className="text-[10px] font-semibold text-foreground/80">学习通服务</span>
                  <span className="text-[10px] font-medium tabular-nums text-muted-foreground">v{appVersion}</span>
                </span>
              </div>
            </div>
            <h1 className="hidden min-w-0 truncate text-base font-semibold text-foreground lg:block">
              {desktopViewTitle}
            </h1>
            <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-4">
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
                  onTaskFilterChange={setTaskFilter}
                  onRefresh={() => void fetchTasks()}
                  onStopTask={handleStopTask}
                />
              </TaskStatusDrawer>

              <div
                className="flex min-w-0 max-w-[154px] items-center gap-1 rounded-md border border-border bg-muted/40 py-0.5 pl-1 pr-1 sm:max-w-none sm:gap-3 sm:py-1 sm:pl-2 sm:pr-3"
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
            <div className="hidden min-w-0 flex-col text-left min-[360px]:flex">
              <span className="max-w-[68px] truncate text-[11px] font-bold sm:max-w-[100px] sm:text-xs sm:font-semibold">{session.displayName}</span>
              <span className="hidden max-w-[100px] truncate text-xs text-muted-foreground sm:block">{session.user.username}</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLogoutConfirmOpen(true)}
              className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground sm:ml-1 sm:h-6 sm:w-6"
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
          <main id="dashboard-main" className="min-h-0 flex-1 overflow-x-clip pb-18 lg:overflow-y-auto lg:pb-0">
            <div className="mx-auto w-full min-w-0 px-0 py-0 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 lg:py-6">
              <div className="min-w-0">
            {/* Courses list tab content */}
            <TabsContent value="courses" className="outline-none m-0 lg:flex-1 lg:min-h-0">
              <Card className="rounded-none border-none bg-card py-0 shadow-none ring-0 sm:rounded-xl sm:py-4 sm:shadow-sm lg:flex lg:h-full lg:min-h-0 lg:flex-col">
                <CardHeader className="flex flex-row items-center gap-2 rounded-none border-b border-border/50 px-3 py-2.5 sm:justify-between sm:px-6 sm:py-4 sm:space-y-0">
                  <div className="flex shrink-0 items-center gap-1 sm:block lg:hidden">
                    <CardTitle className="whitespace-nowrap text-sm font-semibold sm:text-base">课程列表</CardTitle>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={coursesLoading}
                      onClick={fetchCourses}
                      className="h-8 w-8 shrink-0 rounded-full hover:bg-gray-100 sm:hidden dark:hover:bg-[#2d2e30]"
                      title="刷新课程"
                      aria-label="刷新课程"
                    >
                      <RefreshCw className={`w-4 h-4 ${coursesLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-2 sm:justify-end lg:justify-start">
                    <div className="group relative min-w-0 flex-1 sm:max-w-xs">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
                      <Input
                        type="search"
                        value={courseSearch}
                        onChange={(event) => {
                          const value = event.target.value;
                          setCourseSearch(value);
                          if (!isCourseSearchComposing.current) {
                            setCourseSearchQuery(value);
                          }
                        }}
                        onCompositionStart={() => {
                          isCourseSearchComposing.current = true;
                        }}
                        onCompositionEnd={(event) => {
                          isCourseSearchComposing.current = false;
                          setCourseSearchQuery(event.currentTarget.value);
                        }}
                        placeholder="搜索课程名称"
                        aria-label="搜索课程名称"
                        className="course-search-input h-8 rounded-md border-border/80 bg-background/90 pl-9 pr-9 text-[13px] shadow-none transition-all duration-200 placeholder:text-muted-foreground/80 hover:border-primary/40 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10 sm:h-9 sm:rounded-lg sm:pl-10 sm:pr-10 sm:text-sm sm:shadow-sm sm:focus-visible:ring-4"
                      />
                      {courseSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            isCourseSearchComposing.current = false;
                            setCourseSearch('');
                            setCourseSearchQuery('');
                          }}
                          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          aria-label="清除课程搜索"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {courseSearchQuery.trim() && (
                      <span className="hidden whitespace-nowrap text-xs text-muted-foreground xl:inline" role="status">
                        找到 {filteredCourses.length} 门课程
                      </span>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={coursesLoading}
                      onClick={fetchCourses}
                      className="hidden h-8 w-8 shrink-0 rounded-full hover:bg-gray-100 sm:flex dark:hover:bg-[#2d2e30]"
                      title="刷新课程"
                      aria-label="刷新课程"
                    >
                      <RefreshCw className={`w-4 h-4 ${coursesLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                {courseSearchQuery.trim() && (
                  <div className="border-b border-border/50 px-4 py-2 sm:px-6 xl:hidden">
                    <span className="text-xs text-muted-foreground" role="status">
                      找到 {filteredCourses.length} 门课程
                    </span>
                  </div>
                )}
                  <CardContent className="p-0 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                  {coursesLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 text-gray-500 text-sm">
                      <svg className="google-spinner" viewBox="0 0 50 50">
                        <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
                      </svg>
                      <p className="mt-4">拉取课程列表中...</p>
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="text-center p-12 text-gray-500 text-sm font-sans">
                      <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      暂无关联课程，您可以尝试点击右上角刷新重试。
                    </div>
                  ) : filteredCourses.length === 0 ? (
                    <div className="text-center p-12 text-gray-500 text-sm font-sans">
                      <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      {courseSearchQuery.trim() ? '没有匹配的课程，请调整搜索条件。' : '没有可显示课程，可在设置中关闭隐藏无任务点课程。'}
                    </div>
                  ) : (
                    <div className="divide-y divide-[#e1e3e4] dark:divide-[#333537]">
                      {/* Select All Action Row */}
                      {selectableCourses.length > 0 && (
                        <div className="flex items-center justify-between gap-2 border-b border-[#e1e3e4] bg-gray-50/30 px-3 py-2.5 select-none dark:border-[#333537] dark:bg-[#232425]/30 sm:gap-4 sm:px-5 sm:py-3.5">
                          <div className="flex items-center gap-2.5 sm:gap-4">
                            <CourseCheckbox
                              checked={isAllSelected}
                              indeterminate={isSomeSelected && !isAllSelected}
                              onChange={handleToggleSelectAll}
                              disabled={selectableCourses.length === 0}
                            />
                            <span 
                              className="text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer"
                              onClick={handleToggleSelectAll}
                            >
                              {isAllSelected ? '取消全选' : '全选所有课程'}
                            </span>
                          </div>
                          <div className="whitespace-nowrap text-[11px] text-gray-400 dark:text-gray-500 sm:text-xs">
                            已选择 {selectedCourses.size} / {selectableCourses.length} 门课程
                          </div>
                        </div>
                      )}

                      {filteredCourses.map((course) => {
                        const jobFinishCount = course.jobFinishCount;
                        const jobCount = course.jobCount;
                        const hasJobProgress = typeof jobFinishCount === 'number'
                          && typeof jobCount === 'number';
                        const calculatedJobRate = hasJobProgress && jobCount > 0
                          ? Math.round((jobFinishCount / jobCount) * 100)
                          : null;
                        const rawJobRate = course.jobRate ?? calculatedJobRate;
                        const jobRate = rawJobRate === null ? null : Math.max(0, Math.min(100, rawJobRate));
                        const jobProgressLabel = hasJobProgress
                          ? `${jobFinishCount}/${jobCount} (${jobRate ?? 0}%)`
                          : null;
                        const isProcessing = course.processing === true;
                        const processingTaskLabel = course.processingTaskId
                          ? course.processingTaskId.substring(0, 8)
                          : null;
                        const canStopProcessing = isProcessing && Boolean(course.processingTaskId);
                        const isStoppingProcessing = course.processingTaskId === stoppingTaskId;
                        const blockedPointCount = course.blockedPointCount ?? 0;

                        const isExpanded = expandedCourses.has(course.key);
                        const isCourseOutlineFullyExpanded = fullyExpandedCourseOutlines.has(course.key);
                        const isSelected = selectedCourses.has(course.key);
                        const studyIncrement = studyIncrements[course.key] ?? DEFAULT_STUDY_INCREMENT;
                        const studyVisitCount = studyIncrement.visitCount ?? 0;
                        const videoStudyMinutes = studyIncrement.videoStudyMinutes ?? 0;
                        const hasReadTaskPoints = courseDetailsMap[course.key]?.hasReadTaskPoints === true;
                        const readMinutes = hasReadTaskPoints ? (studyIncrement.readMinutes ?? 0) : 0;
                        const hasStudyIncrement = studyVisitCount > 0 || videoStudyMinutes > 0 || readMinutes > 0;
                        const studyIncrementSummary = [
                          studyVisitCount > 0 ? `+${studyVisitCount}次` : null,
                          videoStudyMinutes > 0 ? `视频观看 +${videoStudyMinutes}分钟` : null,
                          readMinutes > 0 ? `阅读 +${readMinutes}分钟` : null,
                        ].filter(Boolean).join(' ');

                        return (
                          <div key={course.key} className="border-b border-border last:border-0">
                            {/* Course Row */}
                            <div className={`grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-2 px-3 py-2.5 transition-colors sm:grid-cols-[auto_minmax(0,1fr)_13rem] sm:gap-x-4 sm:p-5 ${
                              isSelected
                                ? 'bg-primary-container/20 hover:bg-primary-container/30'
                                : 'hover:bg-muted/40'
                            }`}>
                              <div className="contents">
                                {/* Course Selection Checkbox */}
                                <CourseCheckbox
                                  checked={isSelected}
                                  disabled={isProcessing}
                                  indeterminate={false}
                                  onChange={() => toggleCourseSelection(course.key)}
                                />
                                
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="truncate text-xs font-semibold text-foreground sm:text-sm">{course.courseName}</h3>
                                    {blockedPointCount > 0 && (
                                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                                        含未开放任务点 {blockedPointCount}
                                      </Badge>
                                    )}
                                    {isProcessing && (
                                      <Badge variant="outline" className="bg-warning-container text-warning border-warning/20">
                                        处理中
                                      </Badge>
                                    )}
                                  </div>
                                  {processingTaskLabel ? (
                                    <span className="mt-1 inline-flex w-fit items-center rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                                      #{processingTaskLabel}
                                    </span>
                                  ) : null}
                                  
                                  {jobRate !== null && jobProgressLabel && (
                                    <div className="mt-1.5 grid w-full max-w-lg grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:mt-2 sm:grid-cols-[minmax(0,1fr)_8rem] sm:gap-3">
                                      <Progress value={jobRate} className="h-1.5 bg-muted" />
                                      <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-muted-foreground">
                                        {jobProgressLabel}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-1 sm:w-52 sm:flex-nowrap sm:gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isProcessing}
                                  onClick={() => openStudyIncrementSettings(course.key)}
                                  className={`h-8 w-8 rounded px-0 text-xs sm:w-auto ${
                                    hasStudyIncrement
                                      ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary sm:gap-1 sm:px-2'
                                      : 'text-muted-foreground hover:bg-muted hover:text-foreground sm:gap-1.5 sm:px-2.5'
                                  }`}
                                  title={hasStudyIncrement ? studyIncrementSummary : '设置学习目标'}
                                  aria-label={hasStudyIncrement ? `学习目标：${studyIncrementSummary}` : '设置学习目标'}
                                >
                                  <SlidersHorizontal className="h-3.5 w-3.5" />
                                  <span className="sr-only sm:not-sr-only">学习目标</span>
                                  {hasStudyIncrement && <span className="hidden text-xs lg:inline">{studyIncrementSummary}</span>}
                                </Button>
                                {canStopProcessing && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isStoppingProcessing}
                                    onClick={() => void handleStopTask(course.processingTaskId as string)}
                                  className="h-8 w-8 gap-1 rounded border-danger/30 px-0 text-xs text-danger hover:border-danger hover:bg-danger-container/20 sm:w-auto sm:px-2.5"
                                  aria-label={isStoppingProcessing ? '停止任务中' : '停止任务'}
                                  >
                                    {isStoppingProcessing ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Square className="w-3.5 h-3.5 fill-current" />
                                    )}
                                    <span className="sr-only sm:not-sr-only">{isStoppingProcessing ? '停止中' : '停止'}</span>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExpandCourse(course.key)}
                                  className="h-8 w-8 gap-1 rounded border border-primary/30 px-0 text-xs text-primary hover:bg-primary-container/20 sm:w-auto sm:px-2"
                                  aria-label={isExpanded ? '收起章节' : '查看章节'}
                                >
                                  {isExpanded ? (
                                    <>
                                      <span className="sr-only sm:not-sr-only">收起章节</span> <ChevronUp className="w-3.5 h-3.5" />
                                    </>
                                  ) : (
                                    <>
                                      <span className="sr-only sm:not-sr-only">查看章节</span> <ChevronDown className="w-3.5 h-3.5" />
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Expanded Chapters Section */}
                            {isExpanded && (
                              <div className="border-t border-gray-100/50 bg-gray-50/40 px-3 pb-3 pl-11 pt-3 dark:border-[#333537]/50 dark:bg-[#1a1b1c]/20 sm:px-5 sm:pb-5 sm:pl-12 sm:pt-4">
                                {loadingDetails[course.key] ? (
                                  <div className="flex items-center gap-2 py-4 text-xs text-gray-500">
                                    <svg className="google-spinner h-4 w-4" viewBox="0 0 50 50">
                                      <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
                                    </svg>
                                    <span>正在拉取章节...</span>
                                  </div>
                                ) : courseDetailsMap[course.key] ? (
                                  <div className="space-y-2">
                                    {(() => {
                                      const courseDetails = courseDetailsMap[course.key];
                                      const chapterItems = extractChapterItems(courseDetails.chapters);
                                      const chaptersWithTasks = getChapterTaskMetas(chapterItems)
                                        .filter(({ taskMeta }) => taskMeta.hasTaskPoints);

                                      return (
                                        <>
                                          <div className={isCourseOutlineFullyExpanded ? undefined : 'max-sm:max-h-64 max-sm:overflow-hidden'}>
                                            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                              章节大纲 ({chaptersWithTasks.length})
                                            </div>
                                            <div className="grid grid-cols-1 gap-2 pr-1 md:max-h-[300px] md:grid-cols-2 md:overflow-y-auto">
                                          {chaptersWithTasks.map(({ chapter: chap, taskMeta }) => {
                                            const isChapterDone = !taskMeta.isLocked && taskMeta.total > 0 && taskMeta.finished === taskMeta.total;
                                            const chapterDocuments = getChapterDocuments(chap, courseDetails.documents);

                                            return (
                                              <div
                                                key={chap.id}
                                                className="p-2.5 rounded border border-[#e1e3e4] dark:border-[#333537] bg-white dark:bg-[#1e1f20] text-xs"
                                              >
                                                <div className="flex items-start justify-between gap-3">
                                                  <div className="min-w-0 flex-1">
                                                    <span className="font-semibold text-gray-500 dark:text-gray-400 mr-1.5">{chap.label}</span>
                                                    <span className="font-medium text-[#191c1d] dark:text-[#e3e3e3]">{chap.name}</span>
                                                  </div>
                                                  <Badge
                                                    className={`border-none text-xs font-sans font-normal shrink-0 ${
                                                      taskMeta.isLocked
                                                        ? 'bg-[#f3f4f6] hover:bg-[#f3f4f6] text-[#5f6368] dark:bg-[#2a2b2d] dark:hover:bg-[#2a2b2d] dark:text-[#bdc1c6]'
                                                        : isChapterDone
                                                          ? 'bg-[#e6f4ea] hover:bg-[#e6f4ea] text-[#137333] dark:bg-[#12301f] dark:hover:bg-[#12301f] dark:text-[#81c995]'
                                                          : 'bg-[#fef7e0] hover:bg-[#fef7e0] text-[#b06000] dark:bg-[#3b2a12] dark:hover:bg-[#3b2a12] dark:text-[#f6c26b]'
                                                    }`}
                                                  >
                                                    {taskMeta.isLocked ? `未开放任务点: ${taskMeta.total}` : `任务点: ${taskMeta.finished}/${taskMeta.total}`}
                                                  </Badge>
                                                </div>

                                                {account?.id && chapterDocuments.length > 0 && (
                                                  <div className="mt-2 space-y-1.5 border-t border-[#edf0f2] dark:border-[#333537] pt-2">
                                                    {chapterDocuments.map((document) => {
                                                      const fileSize = formatFileSize(document.size);
                                                      const fileName = getCourseDocumentFileName(document);
                                                      return (
                                                        <div
                                                          key={document.id}
                                                          className="flex items-center gap-2 rounded bg-[#f8fafd] dark:bg-[#252628] px-2 py-1.5"
                                                        >
                                                          <FileText className="h-3.5 w-3.5 shrink-0 text-[#5f6368] dark:text-[#bdc1c6]" />
                                                          <div className="min-w-0 flex-1">
                                                            <div className="truncate font-medium text-[#191c1d] dark:text-[#e3e3e3]">
                                                              {document.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                              {getCourseDocumentTypeLabel(document)}
                                                              {fileSize ? ` · ${fileSize}` : ''}
                                                            </div>
                                                          </div>
                                                          <Button
                                                            asChild
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 shrink-0 rounded p-0 text-[#4285F4] dark:text-[#adc6ff]"
                                                          >
                                                            <a
                                                              href={getCourseDocumentDownloadUrl(account.id, course.key, document.id)}
                                                              download={fileName}
                                                              aria-label={`下载 ${document.name}`}
                                                            >
                                                              <Download className="h-3.5 w-3.5" />
                                                            </a>
                                                          </Button>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                          {chaptersWithTasks.length === 0 && (
                                            <div className="text-gray-500 text-xs py-4 text-center col-span-2">该课程没有任务点</div>
                                          )}
                                            </div>
                                          </div>
                                          {chaptersWithTasks.length > 3 && (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              className="mt-2 h-8 w-full gap-1 text-xs text-primary sm:hidden"
                                              onClick={() => toggleFullCourseOutline(course.key)}
                                              aria-expanded={isCourseOutlineFullyExpanded}
                                            >
                                              {isCourseOutlineFullyExpanded ? (
                                                <>
                                                  收起章节列表 <ChevronUp className="h-3.5 w-3.5" />
                                                </>
                                              ) : (
                                                <>
                                                  显示全部 {chaptersWithTasks.length} 个章节 <ChevronDown className="h-3.5 w-3.5" />
                                                </>
                                              )}
                                            </Button>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                ) : (
                                  <div className="text-gray-500 text-xs py-2">
                                    无法加载章节。请点击右上角刷新重试。
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

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

            {/* Account Settings Configuration tab content */}
            <TabsContent value="settings" className="outline-none m-0">
              <Card className="rounded-none border-none bg-card py-0 shadow-none ring-0 sm:rounded-xl sm:py-4 sm:shadow-sm lg:py-0">
                <CardHeader className="rounded-none border-b border-border/50 px-3 py-2.5 sm:px-6 sm:py-4 lg:hidden">
                  <CardTitle className="text-sm font-semibold sm:text-base">提交设置</CardTitle>
                </CardHeader>
                <CardContent className="p-3 text-sm sm:p-6">
                  <div className="space-y-4 sm:space-y-6">
                    <section className="space-y-2" aria-labelledby="notification-settings-heading">
                      <h2 id="notification-settings-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        通知
                      </h2>
                      <EmailNotificationSettings onUnauthorized={onLogout} />
                    </section>

                    <section className="space-y-3 sm:space-y-4" aria-labelledby="task-behavior-settings-heading">
                      <div>
                        <h2 id="task-behavior-settings-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          任务行为
                        </h2>
                      </div>

                    <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/25 p-3 transition-all sm:rounded-lg sm:p-5">
                      <div className="min-w-0 space-y-1 pr-3 sm:space-y-1.5 sm:pr-4">
                        <Label htmlFor="hideEmptyTaskCourses" className="text-sm font-semibold cursor-pointer block text-[#191c1d] dark:text-[#e3e3e3]">
                          隐藏无任务点课程
                        </Label>
                        <div
                          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${hiddenEmptyTaskCourseCount > 0 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                          aria-hidden={hiddenEmptyTaskCourseCount === 0}
                        >
                          <div className="min-h-0 overflow-hidden">
                            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                              当前已隐藏 {hiddenEmptyTaskCourseCount} 门
                            </p>
                          </div>
                        </div>
                      </div>
                      <Switch
                        id="hideEmptyTaskCourses"
                        checked={hideEmptyTaskCourses}
                        onCheckedChange={(checked) => updateSettingSwitch('hideEmptyTaskCourses', checked)}
                        className="shrink-0"
                      />
                    </div>

                    {/* 章节测试 */}
                    <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/25 p-3 transition-all sm:rounded-lg sm:p-5">
                      <div className="min-w-0 space-y-1 pr-3 sm:space-y-1.5 sm:pr-4">
                        <Label htmlFor="doChapterTest" className="text-sm font-semibold cursor-pointer block text-[#191c1d] dark:text-[#e3e3e3]">
                          章节测试自动答题
                        </Label>
                      </div>
                      <Switch
                        id="doChapterTest"
                        checked={doChapterTest}
                        onCheckedChange={(checked) => updateSettingSwitch('doChapterTest', checked)}
                        className="shrink-0"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:gap-6 xl:grid-cols-2">
                      {/* 课程作业 */}
                      <div className="rounded-md border border-border/50 bg-muted/25 p-3 sm:rounded-lg sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="doWork" className="text-sm font-semibold cursor-pointer text-[#191c1d] dark:text-[#e3e3e3]">课程作业自动答题</Label>
                          </div>
                          <Switch
                            id="doWork"
                            checked={doWork}
                            onCheckedChange={(checked) => updateSettingSwitch('doWork', checked)}
                            className="shrink-0"
                          />
                        </div>

                        <div
                          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${doWork ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                          aria-hidden={!doWork}
                        >
                          <div className="min-h-0 overflow-hidden">
                            <div className="grid grid-cols-2 gap-2 pt-3 sm:gap-4 sm:pt-4 md:grid-cols-2">
                              <button
                            type="button"
                            disabled={!doWork}
                            onClick={() => updateWorkAutoSubmit(1)}
                            className={`flex min-h-11 items-center justify-between rounded-md border px-3 py-2 text-left shadow-sm transition-all duration-200 disabled:cursor-not-allowed sm:rounded-lg sm:px-4 sm:py-3 ${
                              doWork && workAutoSubmit === 1
                                ? 'border-[#1a73e8] bg-[#e8f0fe]/30 dark:border-[#8ab4f8] dark:bg-[#8ab4f8]/10'
                                : 'border-[#e1e3e4] bg-white hover:border-[#c2c6d5] dark:border-[#333537] dark:bg-[#1f2021] dark:hover:border-[#5f6368]'
                            }`}
                          >
                            <span className={`text-sm font-medium transition-colors ${
                              doWork && workAutoSubmit === 1
                                ? 'text-[#1a73e8] dark:text-[#8ab4f8]'
                                : 'text-[#191c1d] dark:text-[#e3e3e3]'
                            }`}>自动提交</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              doWork && workAutoSubmit === 1
                                ? 'border-[#1a73e8] bg-[#1a73e8] dark:border-[#8ab4f8] dark:bg-[#8ab4f8]'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {doWork && workAutoSubmit === 1 && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-[#121314]" />
                              )}
                            </div>
                              </button>

                          <button
                            type="button"
                            disabled={!doWork}
                            onClick={() => updateWorkAutoSubmit(0)}
                            className={`flex min-h-11 items-center justify-between rounded-md border px-3 py-2 text-left shadow-sm transition-all duration-200 disabled:cursor-not-allowed sm:rounded-lg sm:px-4 sm:py-3 ${
                              doWork && workAutoSubmit === 0
                                ? 'border-[#1a73e8] bg-[#e8f0fe]/30 dark:border-[#8ab4f8] dark:bg-[#8ab4f8]/10'
                                : 'border-[#e1e3e4] bg-white hover:border-[#c2c6d5] dark:border-[#333537] dark:bg-[#1f2021] dark:hover:border-[#5f6368]'
                            }`}
                          >
                            <span className={`text-sm font-medium transition-colors ${
                              doWork && workAutoSubmit === 0
                                ? 'text-[#1a73e8] dark:text-[#8ab4f8]'
                                : 'text-[#191c1d] dark:text-[#e3e3e3]'
                            }`}>仅保存不提交</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              doWork && workAutoSubmit === 0
                                ? 'border-[#1a73e8] bg-[#1a73e8] dark:border-[#8ab4f8] dark:bg-[#8ab4f8]'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {doWork && workAutoSubmit === 0 && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-[#121314]" />
                              )}
                            </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 考试自动答题 */}
                      <div className="rounded-md border border-border/50 bg-muted/25 p-3 sm:rounded-lg sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="doExam" className="text-sm font-semibold cursor-pointer text-[#191c1d] dark:text-[#e3e3e3]">考试自动答题</Label>
                          </div>
                          <Switch
                            id="doExam"
                            checked={doExam}
                            onCheckedChange={(checked) => updateSettingSwitch('doExam', checked)}
                            className="shrink-0"
                          />
                        </div>

                        <div
                          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${doExam ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                          aria-hidden={!doExam}
                        >
                          <div className="min-h-0 overflow-hidden">
                            <div className="grid grid-cols-2 gap-2 pt-3 sm:gap-4 sm:pt-4 md:grid-cols-2">
                              <button
                            type="button"
                            disabled={!doExam}
                            onClick={() => updateExamAutoSubmit(1)}
                            className={`flex min-h-11 items-center justify-between rounded-md border px-3 py-2 text-left shadow-sm transition-all duration-200 disabled:cursor-not-allowed sm:rounded-lg sm:px-4 sm:py-3 ${
                              doExam && examAutoSubmit === 1
                                ? 'border-[#1a73e8] bg-[#e8f0fe]/30 dark:border-[#8ab4f8] dark:bg-[#8ab4f8]/10'
                                : 'border-[#e1e3e4] bg-white hover:border-[#c2c6d5] dark:border-[#333537] dark:bg-[#1f2021] dark:hover:border-[#5f6368]'
                            }`}
                          >
                            <span className={`text-sm font-medium transition-colors ${
                              doExam && examAutoSubmit === 1
                                ? 'text-[#1a73e8] dark:text-[#8ab4f8]'
                                : 'text-[#191c1d] dark:text-[#e3e3e3]'
                            }`}>自动提交</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              doExam && examAutoSubmit === 1
                                ? 'border-[#1a73e8] bg-[#1a73e8] dark:border-[#8ab4f8] dark:bg-[#8ab4f8]'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {doExam && examAutoSubmit === 1 && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-[#121314]" />
                              )}
                            </div>
                              </button>

                          <button
                            type="button"
                            disabled={!doExam}
                            onClick={() => updateExamAutoSubmit(0)}
                            className={`flex min-h-11 items-center justify-between rounded-md border px-3 py-2 text-left shadow-sm transition-all duration-200 disabled:cursor-not-allowed sm:rounded-lg sm:px-4 sm:py-3 ${
                              doExam && examAutoSubmit === 0
                                ? 'border-[#1a73e8] bg-[#e8f0fe]/30 dark:border-[#8ab4f8] dark:bg-[#8ab4f8]/10'
                                : 'border-[#e1e3e4] bg-white hover:border-[#c2c6d5] dark:border-[#333537] dark:bg-[#1f2021] dark:hover:border-[#5f6368]'
                            }`}
                          >
                            <span className={`text-sm font-medium transition-colors ${
                              doExam && examAutoSubmit === 0
                                ? 'text-[#1a73e8] dark:text-[#8ab4f8]'
                                : 'text-[#191c1d] dark:text-[#e3e3e3]'
                            }`}>仅保存不提交</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              doExam && examAutoSubmit === 0
                                ? 'border-[#1a73e8] bg-[#1a73e8] dark:border-[#8ab4f8] dark:bg-[#8ab4f8]'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {doExam && examAutoSubmit === 0 && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-[#121314]" />
                              )}
                            </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    </section>
                  </div>
                </CardContent>
              </Card>
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


      {/* 批量控制 Floating Control Capsule */}
      {selectedCourses.size > 0 && (
        <div className="fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-50 flex items-center justify-between gap-2.5 rounded-2xl border border-border/80 bg-card/95 p-2 shadow-floating backdrop-blur-md animate-bottom-bar-enter sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:w-max sm:-translate-x-1/2 sm:px-4 sm:py-2">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 text-xs sm:text-sm">
            <span className="font-semibold text-foreground whitespace-nowrap">
              已选 <span className="tabular-nums font-bold text-primary">{selectedCourses.size}</span> 门课程
            </span>
            {Array.from(selectedCourses).some((key) => {
              const inc = studyIncrements[key];
              return (inc?.visitCount ?? 0) > 0 || (inc?.videoStudyMinutes ?? 0) > 0 || (inc?.readMinutes ?? 0) > 0;
            }) && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-primary-container/40 px-2 py-0.5 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                已设学习目标
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
              title="取消选择"
              aria-label="取消选择"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              清除
            </Button>
            <Button
              type="button"
              onClick={createTaskWithSelection}
              disabled={creatingTask}
              className="h-8 shrink-0 gap-1.5 px-3.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs rounded-lg transition-all"
            >
              {creatingTask ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
              )}
              <span>提交任务</span>
            </Button>
          </div>
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
        previousTab={prevTab}
        activeTaskCount={taskCounts.active}
        signMonitorActive={signMonitorActive}
        onTabChange={handleTabChange}
      />
    </div>
  );
};
