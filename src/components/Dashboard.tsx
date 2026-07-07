import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

import {
  createTask,
  getCourseDetails,
  getCourses,
  getErrorMessage,
  getTasks,
  getUserFacingErrorMessage,
  isAuthExitError,
  stopTask,
} from '@/lib/api';
import { extractChapterItems, getChapterTaskMetas } from '@/lib/courseChapters';
import type { AuthSession, Course, CourseDetails, Task, CoursesCustom } from '@/lib/api';
import { notifyAuthExit } from '@/lib/notifications';
import { TaskInlineItem } from './TaskInlineItem';
import { SignMonitor } from './SignMonitor';
import { 
  LogOut, 
  Settings, 
  BookOpen, 
  Play, 
  Square,
  Activity,
  RefreshCw, 
  AlertCircle, 
  Sun, 
  Moon,
  ChevronDown,
  ChevronUp,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

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

interface PersistedSettingsState {
  accountId: string | null;
  form: SettingsFormState;
}

const DEFAULT_SETTINGS = {
  hideEmptyTaskCourses: true,
  doChapterTest: true,
  doWork: false,
  workAutoSubmit: 0,
  doExam: false,
  examAutoSubmit: 0,
} as const;

const ACTIVE_TASK_STATUSES = ['pending', 'running', 'stopping'] as const;

function isActiveTaskStatus(status: Task['status']) {
  return ACTIVE_TASK_STATUSES.includes(status as (typeof ACTIVE_TASK_STATUSES)[number]);
}

function courseHasTaskPoints(course: Course) {
  const hasKnownTaskCount = typeof course.jobCount === 'number' || typeof course.blockedPointCount === 'number';
  if (!hasKnownTaskCount) {
    return true;
  }

  return (course.jobCount ?? 0) > 0 || (course.blockedPointCount ?? 0) > 0;
}

const TASK_SETTINGS_STORAGE_PREFIX = 'yatori-task-settings:';

function getTaskSettingsStorageKey(accountId: string) {
  return `${TASK_SETTINGS_STORAGE_PREFIX}${accountId}`;
}

function createDefaultSettingsFormState(): SettingsFormState {
  return { ...DEFAULT_SETTINGS };
}

function readPersistedSettings(accountId: string | null | undefined): SettingsFormState {
  if (!accountId) {
    return createDefaultSettingsFormState();
  }

  const raw = localStorage.getItem(getTaskSettingsStorageKey(accountId));
  if (!raw) {
    return createDefaultSettingsFormState();
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return createDefaultSettingsFormState();
    }

    const settings = parsed as Partial<Omit<SettingsFormState, 'workAutoSubmit' | 'examAutoSubmit'>> & {
      workAutoSubmit?: unknown;
      examAutoSubmit?: unknown;
    };
    const rawWorkAutoSubmit = settings.workAutoSubmit;
    const rawExamAutoSubmit = settings.examAutoSubmit;
    const workAutoSubmit = rawWorkAutoSubmit === 1 || rawWorkAutoSubmit === 2 || rawWorkAutoSubmit === true
        ? rawWorkAutoSubmit === 2 ? 2 : 1
        : 0;
    const examAutoSubmit = rawExamAutoSubmit === 1 || rawExamAutoSubmit === 2 || rawExamAutoSubmit === true
        ? rawExamAutoSubmit === 2 ? 2 : 1
        : 0;

    return {
      hideEmptyTaskCourses: settings.hideEmptyTaskCourses !== false,
      doChapterTest: settings.doChapterTest !== false,
      doWork: settings.doWork === true,
      workAutoSubmit: settings.doWork === true ? workAutoSubmit : 0,
      doExam: settings.doExam === true,
      examAutoSubmit: settings.doExam === true ? examAutoSubmit : 0,
    };
  } catch (error) {
    console.error('Failed to parse task settings', error);
    localStorage.removeItem(getTaskSettingsStorageKey(accountId));
    return createDefaultSettingsFormState();
  }
}

export const Dashboard: React.FC<DashboardProps> = ({ session, onLogout }) => {
  const account = session.account;
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState('courses');
  const [prevTab, setPrevTab] = useState('courses');
  const [taskFilter, setTaskFilter] = useState<'active' | 'completed'>('active');

  const handleTabChange = useCallback((tabId: string) => {
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
  const [courseDetailsMap, setCourseDetailsMap] = useState<Record<string, CourseDetails>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  
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

  // Dark mode trigger
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const settingsForm = persistedSettingsState.accountId === currentAccountId
    ? persistedSettingsState.form
    : readPersistedSettings(currentAccountId);

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
      answerMode: 'xxt',
      includeCourses: [],
      excludeCourses: [],
      coursesSettings: [],
      ...overrides,
    };
  }, [doChapterTest, doExam, doWork, examAutoSubmit, workAutoSubmit]);

  const fetchCourses = useCallback(async () => {
    if (!account) return;
    setCoursesLoading(true);
    try {
      const response = await getCourses(account.id);
      if (response.code === 200) {
        const nextCourses = (response.data?.courses ?? []).filter((course): course is Course => {
          return typeof course?.key === 'string' && course.key.trim().length > 0;
        });
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

  const fetchTasks = useCallback(async (options: { showLoading?: boolean } = {}) => {
    const showLoading = options.showLoading ?? true;
    if (showLoading) {
      setTasksLoading(true);
    }
    try {
      const response = await getTasks();
      if (response.code === 200 && response.data?.tasks) {
        setTasks(response.data.tasks);
      }
    } catch (error) {
      if (isAuthExitError(error)) {
        notifyAuthExit(getUserFacingErrorMessage(error, '登录已失效，请重新登录'));
        onLogout();
        return;
      }
      console.error(error);
      toast.error(getUserFacingErrorMessage(error, '加载任务失败，请稍后重试'));
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
      if (response.code === 200 && response.data) {
        const details = response.data;
        setCourseDetailsMap(prev => ({ ...prev, [classId]: details }));
      }
    } catch (error) {
      if (isAuthExitError(error)) {
        notifyAuthExit(getUserFacingErrorMessage(error, '登录已失效，请重新登录'));
        onLogout();
        return;
      }
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes('课程章节为空')) {
        const course = courses.find((item) => item.key === classId) ?? { key: classId };
        setCourseDetailsMap(prev => ({
          ...prev,
          [classId]: {
            course,
            chapters: { isstart: false },
            exams: [],
          },
        }));
        return;
      }
      console.error(error);
      toast.error(getUserFacingErrorMessage(error, '加载课程详情失败，请稍后重试'));
    } finally {
      setLoadingDetails(prev => ({ ...prev, [classId]: false }));
    }
  }, [account, courses, onLogout]);



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

  const hiddenEmptyTaskCourseCount = courses.length - visibleCourses.length;
  const selectableCourses = visibleCourses.filter(course => !course.processing);
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

  const clearSelection = () => {
    setSelectedCourses(new Set());
  };

  const getSelectedProcessingCourses = (courseKeys: string[]) => {
    const courseKeySet = new Set(courseKeys);
    return courses.filter((course) => course.processing && courseKeySet.has(course.key));
  };

  const createTaskWithSelection = async () => {
    if (!account) return;
    setCreatingTask(true);
    
    const includeCoursesList = Array.from(selectedCourses);

    if (includeCoursesList.length === 0) {
      toast.error('请先选择课程');
      setCreatingTask(false);
      return;
    }

    const processingCourses = getSelectedProcessingCourses(includeCoursesList);
    if (processingCourses.length > 0) {
      toast.error(`以下课程已有进行中的任务：${processingCourses.map((course) => course.courseName || course.key).join('、')}`);
      setCreatingTask(false);
      void fetchCourses();
      return;
    }

    const hours = new Date().getHours();
    if (hours >= 23 || hours < 7) {
      const proceed = window.confirm('提示：当前处于夜间时段（23:00 - 07:00），夜间执行任务可能会被学习通打回并清空进度，是否继续提交？');
      if (!proceed) {
        setCreatingTask(false);
        return;
      }
    }

    const customConfig: CoursesCustom = buildCoursesCustom({
      includeCourses: includeCoursesList,
      excludeCourses: [],
    });

    try {
      const createResponse = await createTask({
        accountId: account.id,
        coursesCustom: customConfig,
      });

      if (createResponse.data) {
        toast.success('任务已启动');
        if (window.matchMedia('(max-width: 1023px)').matches) {
          setTaskFilter('active');
          handleTabChange('tasks');
        }
        void fetchTasks({ showLoading: false });
        void fetchCourses();
        setSelectedCourses(new Set());
      }
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

  const updateSettingSwitch = (key: keyof SettingsFormState, checked: boolean) => {
    const nextForm = {
      ...settingsForm,
      [key]: checked,
    };

    if (key === 'doWork' && !checked) {
      nextForm.workAutoSubmit = 0;
    }

    if (key === 'doExam' && !checked) {
      nextForm.examAutoSubmit = 0;
    }

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
    setPersistedSettingsState({
      accountId: currentAccountId,
      form: {
        ...settingsForm,
        workAutoSubmit: value,
      },
    });
  };

  const updateExamAutoSubmit = (value: SettingsFormState['examAutoSubmit']) => {
    setPersistedSettingsState({
      accountId: currentAccountId,
      form: {
        ...settingsForm,
        examAutoSubmit: value,
      },
    });
  };

  const handleStopTask = async (taskId: string) => {
    setStoppingTaskId(taskId);
    try {
      const response = await stopTask(taskId);
      if (response.code === 200) {
        toast.info('已发送停止请求');
        void fetchTasks({ showLoading: false });
        void fetchCourses();
      }
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

  // Handle stream list updates every 15s to keep task statuses up to date
  useEffect(() => {
    if (!account) {
      return;
    }

    const timer = setInterval(() => {
      void fetchTasks({ showLoading: false });
    }, 15000);
    return () => clearInterval(timer);
  }, [account, fetchTasks]);

  // Tab transition calculations (direction, distance, speed/duration)
  const tabsList = ['courses', 'sign', 'tasks', 'settings'];
  const prevIndex = tabsList.indexOf(prevTab);
  const currentIndex = tabsList.indexOf(activeTab);
  const tabSwitchDistance = Math.abs(currentIndex - prevIndex);
  const isMovingRight = currentIndex >= prevIndex;

  const translateVal = tabSwitchDistance === 0 ? 0 : 10 + tabSwitchDistance * 4;
  const startTranslateX = tabSwitchDistance === 0 ? '0px' : (isMovingRight ? `${translateVal}px` : `-${translateVal}px`);
  const durationMs = tabSwitchDistance === 0 ? 200 : 220 + tabSwitchDistance * 40;

  const tabsStyle = {
    '--tab-transition-duration': `${durationMs}ms`,
    '--tab-transition-start-x': startTranslateX,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#121314] text-[#191c1d] dark:text-[#e3e3e3] flex flex-col transition-colors duration-300 font-sans">
      {/* Navigation Top bar */}
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#1f2021] border-b border-[#e1e3e4] dark:border-[#333537] shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-xl tracking-tight select-none flex items-center whitespace-nowrap">
            <span className="text-[#4285F4]">Y</span>
            <span className="text-[#EA4335]">a</span>
            <span className="text-[#FBBC05]">t</span>
            <span className="text-[#4285F4]">o</span>
            <span className="text-[#34A853]">r</span>
            <span className="text-[#EA4335]">i</span>
            <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">学习通服务</span>
          </span>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={toggleDarkMode}
            className="rounded-md hover:bg-gray-100 dark:hover:bg-[#2d2e30] h-9 w-9 text-gray-600 dark:text-gray-300"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* User profile details */}
          <div className="flex items-center gap-3 border border-[#c2c6d5] dark:border-[#444748] rounded-md pl-2 pr-3 py-1 bg-gray-50 dark:bg-[#252627]">
            {session.avatarUrl ? (
              <img 
                src={session.avatarUrl} 
                alt="头像" 
                className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xs font-semibold">
                {session.displayName.substring(0, 1).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold max-w-[100px] truncate">{session.displayName}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[100px]">{session.user.username}</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onLogout}
              className="h-6 w-6 rounded-md hover:bg-gray-200 dark:hover:bg-[#393a3b] text-gray-600 dark:text-gray-300 ml-1"
              title="退出登录"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>
      {/* Google Accent Bar */}
      <div className="google-accent-bar">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>

      {/* Main content grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-20 lg:pb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column / tabs container */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
          
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
            style={tabsStyle}
          >
            <TabsList className="hidden lg:flex w-full justify-start bg-transparent h-auto p-0 mb-6 gap-2">
              <TabsTrigger 
                value="courses"
                className="rounded-md px-4 py-2 font-medium text-sm text-gray-600 dark:text-gray-400 data-[state=active]:bg-[#e8f0fe] data-[state=active]:text-[#1a73e8] dark:data-[state=active]:bg-[#8ab4f8]/20 dark:data-[state=active]:text-[#8ab4f8] hover:bg-gray-100 dark:hover:bg-[#2d2e30] data-[state=active]:hover:bg-[#e8f0fe] dark:data-[state=active]:hover:bg-[#8ab4f8]/20 transition-colors shadow-none border-none"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                课程列表 ({visibleCourses.length})
              </TabsTrigger>
              <TabsTrigger 
                value="sign"
                className="rounded-md px-4 py-2 font-medium text-sm text-gray-600 dark:text-gray-400 data-[state=active]:bg-[#e8f0fe] data-[state=active]:text-[#1a73e8] dark:data-[state=active]:bg-[#8ab4f8]/20 dark:data-[state=active]:text-[#8ab4f8] hover:bg-gray-100 dark:hover:bg-[#2d2e30] data-[state=active]:hover:bg-[#e8f0fe] dark:data-[state=active]:hover:bg-[#8ab4f8]/20 transition-colors shadow-none border-none"
              >
                <MapPin className="w-4 h-4 mr-2" />
                自动签到
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="rounded-md px-4 py-2 font-medium text-sm text-gray-600 dark:text-gray-400 data-[state=active]:bg-[#e8f0fe] data-[state=active]:text-[#1a73e8] dark:data-[state=active]:bg-[#8ab4f8]/20 dark:data-[state=active]:text-[#8ab4f8] hover:bg-gray-100 dark:hover:bg-[#2d2e30] data-[state=active]:hover:bg-[#e8f0fe] dark:data-[state=active]:hover:bg-[#8ab4f8]/20 transition-colors shadow-none border-none"
              >
                <Settings className="w-4 h-4 mr-2" />
                提交设置
              </TabsTrigger>
            </TabsList>

            {/* Courses list tab content */}
            <TabsContent value="courses" className="outline-none m-0">
              <Card className="bg-card shadow-sm border-none">
                <CardHeader className="py-4 px-6 border-b border-border/50 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base font-semibold">课程列表</CardTitle>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={coursesLoading}
                    onClick={fetchCourses}
                    className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-[#2d2e30]"
                    title="刷新课程"
                  >
                    <RefreshCw className={`w-4 h-4 ${coursesLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
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
                  ) : visibleCourses.length === 0 ? (
                    <div className="text-center p-12 text-gray-500 text-sm font-sans">
                      <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      没有可显示课程，可在设置中关闭隐藏无任务点课程。
                    </div>
                  ) : (
                    <div className="divide-y divide-[#e1e3e4] dark:divide-[#333537]">
                      {/* Select All Action Row */}
                      {selectableCourses.length > 0 && (
                        <div className="px-5 py-3.5 bg-gray-50/30 dark:bg-[#232425]/30 flex items-center justify-between gap-4 border-b border-[#e1e3e4] dark:border-[#333537] select-none">
                          <div className="flex items-center gap-4">
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
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            已选择 {selectedCourses.size} / {selectableCourses.length} 门课程
                          </div>
                        </div>
                      )}

                      {visibleCourses.map((course) => {
                        const courseName = course.courseName || `课程 ${course.key}`;
                        const jobFinishCount = course.jobFinishCount ?? 0;
                        const jobCount = course.jobCount ?? 0;
                        const rawJobRate = Math.round(course.jobRate ?? (jobCount > 0 ? (jobFinishCount / jobCount) * 100 : 0));
                        const jobRate = Math.max(0, Math.min(100, rawJobRate));
                        const isProcessing = course.processing === true;
                        const processingTaskLabel = course.processingTaskId
                          ? `Task: ${course.processingTaskId.substring(0, 8)}...`
                          : null;
                        const canStopProcessing = isProcessing && Boolean(course.processingTaskId);
                        const isStoppingProcessing = course.processingTaskId === stoppingTaskId;
                        const blockedPointCount = course.blockedPointCount ?? 0;

                        const isExpanded = expandedCourses.has(course.key);

                        return (
                          <div key={course.key} className="border-b border-[#e1e3e4] dark:border-[#333537] last:border-0">
                            {/* Course Row */}
                            <div className={`p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                              selectedCourses.has(course.key)
                                ? 'bg-[#e8f0fe]/40 dark:bg-[#adc6ff]/10 hover:bg-[#e8f0fe]/60 dark:hover:bg-[#adc6ff]/15'
                                : 'hover:bg-gray-50/50 dark:hover:bg-[#232425]'
                            }`}>
                              <div className="flex gap-4 items-center flex-1 min-w-0 w-full">
                                {/* Course Selection Checkbox */}
                                <CourseCheckbox
                                  checked={selectedCourses.has(course.key)}
                                  disabled={isProcessing}
                                  indeterminate={false}
                                  onChange={() => toggleCourseSelection(course.key)}
                                />
                                
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-sm font-semibold truncate text-[#191c1d] dark:text-[#e3e3e3]">{courseName}</h3>
                                    {blockedPointCount > 0 && (
                                      <Badge className="bg-[#f3f4f6] hover:bg-[#f3f4f6] text-[#5f6368] dark:bg-[#2a2b2d] dark:hover:bg-[#2a2b2d] dark:text-[#bdc1c6] border-none">
                                        含未开放任务点 {blockedPointCount}
                                      </Badge>
                                    )}
                                    {isProcessing && (
                                      <Badge className="bg-[#fef7e0] hover:bg-[#fef7e0] text-[#b06000] dark:bg-[#3b2a12] dark:hover:bg-[#3b2a12] dark:text-[#f6c26b] border-none">
                                        处理中
                                      </Badge>
                                    )}
                                  </div>
                                  {processingTaskLabel ? (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {processingTaskLabel}
                                    </p>
                                  ) : null}
                                  
                                  {/* Job finished rate */}
                                  <div className="grid grid-cols-[minmax(0,1fr)_8rem] items-center gap-3 mt-2 w-full max-w-lg">
                                    <Progress value={jobRate} className="h-1.5 bg-gray-100 dark:bg-gray-700" />
                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap tabular-nums">
                                      {jobFinishCount}/{jobCount} ({jobRate}%)
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 justify-end w-full sm:w-auto self-stretch sm:self-auto">
                                {canStopProcessing && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isStoppingProcessing}
                                    onClick={() => void handleStopTask(course.processingTaskId as string)}
                                    className="h-8 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive rounded"
                                  >
                                    {isStoppingProcessing ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Square className="w-3.5 h-3.5 fill-current" />
                                    )}
                                    {isStoppingProcessing ? '停止中' : '停止'}
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExpandCourse(course.key)}
                                  className="h-8 text-xs gap-1 border border-[#c2c6d5] dark:border-[#444748] hover:bg-gray-50/50 dark:hover:bg-[#2d2e30] rounded text-[#4285F4] dark:text-[#adc6ff]"
                                >
                                  {isExpanded ? (
                                    <>
                                      收起章节 <ChevronUp className="w-3.5 h-3.5" />
                                    </>
                                  ) : (
                                    <>
                                      查看章节 <ChevronDown className="w-3.5 h-3.5" />
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Expanded Chapters Section */}
                            {isExpanded && (
                              <div className="px-5 pb-5 pl-12 bg-gray-50/40 dark:bg-[#1a1b1c]/20 border-t border-gray-100/50 dark:border-[#333537]/50 pt-4">
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
                                      const chapterItems = extractChapterItems(courseDetailsMap[course.key].chapters);
                                      const chaptersWithTasks = getChapterTaskMetas(chapterItems)
                                        .filter(({ taskMeta }) => taskMeta.hasTaskPoints);

                                      return (
                                        <>
                                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                          章节大纲 ({chaptersWithTasks.length})
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                                          {chaptersWithTasks.map(({ chapter: chap, taskMeta }) => {
                                            const isChapterDone = !taskMeta.isLocked && taskMeta.total > 0 && taskMeta.finished === taskMeta.total;
                                          return (
                                            <div 
                                              key={chap.id} 
                                              className="p-2.5 rounded border border-[#e1e3e4] dark:border-[#333537] bg-white dark:bg-[#1e1f20] flex items-center justify-between text-xs gap-3"
                                            >
                                              <div className="min-w-0 flex-1">
                                                <span className="font-semibold text-gray-500 dark:text-gray-400 mr-1.5">{chap.label}</span>
                                                <span className="font-medium text-[#191c1d] dark:text-[#e3e3e3]">{chap.name}</span>
                                              </div>
                                              <Badge
                                                className={`border-none text-[10px] font-sans font-normal shrink-0 ${
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
                                          );
                                        })}
                                          {chaptersWithTasks.length === 0 && (
                                            <div className="text-gray-500 text-xs py-4 text-center col-span-2">该课程没有任务点</div>
                                          )}
                                    </div>
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
            <TabsContent value="sign" className="outline-none m-0">
              {account?.id && (
                <SignMonitor 
                  accountId={account.id} 
                  onUnauthorized={onLogout} 
                />
              )}
            </TabsContent>

            {/* Account Settings Configuration tab content */}
            <TabsContent value="settings" className="outline-none m-0">
              <Card className="bg-card shadow-sm border-none">
                <CardHeader className="py-4 px-4 sm:px-6 border-b border-border/50">
                  <CardTitle className="text-base font-semibold">作答控制</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 text-sm">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 sm:p-5 border border-border/50 rounded-lg bg-muted/25 transition-all">
                      <div className="space-y-1.5 pr-4 min-w-0">
                        <Label htmlFor="hideEmptyTaskCourses" className="text-sm font-semibold cursor-pointer block text-[#191c1d] dark:text-[#e3e3e3]">
                          隐藏无任务点课程
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          开启后，课程列表不显示任务点为 0 的课程
                          {hiddenEmptyTaskCourseCount > 0 ? `，当前已隐藏 ${hiddenEmptyTaskCourseCount} 门` : ''}
                        </p>
                      </div>
                      <Switch
                        id="hideEmptyTaskCourses"
                        checked={hideEmptyTaskCourses}
                        onCheckedChange={(checked) => updateSettingSwitch('hideEmptyTaskCourses', checked)}
                        className="shrink-0"
                      />
                    </div>

                    {/* 章节测试 */}
                    <div className="flex items-center justify-between p-4 sm:p-5 border border-border/50 rounded-lg bg-muted/25 transition-all">
                      <div className="space-y-1.5 pr-4 min-w-0">
                        <Label htmlFor="doChapterTest" className="text-sm font-semibold cursor-pointer block text-[#191c1d] dark:text-[#e3e3e3]">
                          章节测试自动答题
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          开启后，将自动完成所选课程的章节测试任务点
                        </p>
                      </div>
                      <Switch
                        id="doChapterTest"
                        checked={doChapterTest}
                        onCheckedChange={(checked) => updateSettingSwitch('doChapterTest', checked)}
                        className="shrink-0"
                      />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {/* 课程作业 */}
                      <div className="space-y-4 rounded-lg border border-border/50 bg-muted/25 p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="doWork" className="text-sm font-semibold cursor-pointer text-[#191c1d] dark:text-[#e3e3e3]">课程作业自动答题</Label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">开启后，将自动作答所选课程中的作业</p>
                          </div>
                          <Switch
                            id="doWork"
                            checked={doWork}
                            onCheckedChange={(checked) => updateSettingSwitch('doWork', checked)}
                            className="shrink-0"
                          />
                        </div>

                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 ${doWork ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                          <button
                            type="button"
                            disabled={!doWork}
                            onClick={() => updateWorkAutoSubmit(1)}
                            className={`rounded-lg border px-4 py-3 text-left transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-between shadow-sm ${
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
                            className={`rounded-lg border px-4 py-3 text-left transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-between shadow-sm ${
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

                      {/* 考试自动答题 */}
                      <div className="space-y-4 rounded-lg border border-border/50 bg-muted/25 p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="doExam" className="text-sm font-semibold cursor-pointer text-[#191c1d] dark:text-[#e3e3e3]">考试自动答题</Label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">开启后，将自动作答所选课程中已开放的考试</p>
                          </div>
                          <Switch
                            id="doExam"
                            checked={doExam}
                            onCheckedChange={(checked) => updateSettingSwitch('doExam', checked)}
                            className="shrink-0"
                          />
                        </div>

                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 ${doExam ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                          <button
                            type="button"
                            disabled={!doExam}
                            onClick={() => updateExamAutoSubmit(1)}
                            className={`rounded-lg border px-4 py-3 text-left transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-between shadow-sm ${
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
                            className={`rounded-lg border px-4 py-3 text-left transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-between shadow-sm ${
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mobile Tasks tab content */}
            <TabsContent value="tasks" className="lg:hidden outline-none m-0">
              {/* Mobile Tasks Card */}
              <Card className="bg-card shadow-sm border-none min-w-0 w-full overflow-hidden">
                <CardHeader className="py-4 px-4 sm:px-6 border-b border-border/50 flex flex-row items-start justify-between gap-3 space-y-0 min-w-0">
                  <div className="min-w-0">
                    <CardTitle className="text-base font-semibold">任务列表</CardTitle>
                    <CardDescription className="text-xs wrap-anywhere">查看您的任务运行状态与进度</CardDescription>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={tasksLoading}
                    onClick={() => void fetchTasks()}
                    className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-[#2d2e30] shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${tasksLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardHeader>
                <CardContent className="p-0 min-w-0 w-full overflow-hidden">
                  {/* Task Filter Chips */}
                  {tasks.length > 0 && (
                    <div className="flex gap-2 px-4 sm:px-6 py-3 border-b border-border/40 overflow-x-auto no-scrollbar">
                      {[
                        { id: 'active', label: '进行中', count: tasks.filter(t => isActiveTaskStatus(t.status)).length },
                        { id: 'completed', label: '已结束', count: tasks.filter(t => !isActiveTaskStatus(t.status)).length },
                      ].map(chip => (
                        <button
                          key={chip.id}
                          onClick={() => setTaskFilter(chip.id as 'active' | 'completed')}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            taskFilter === chip.id
                              ? 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#8ab4f8]/20 dark:text-[#8ab4f8]'
                              : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {chip.label}
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-sm ${
                            taskFilter === chip.id
                              ? 'bg-[#1a73e8]/15 text-[#1a73e8] dark:bg-[#8ab4f8]/30 dark:text-[#8ab4f8]'
                              : 'bg-muted-foreground/10 text-muted-foreground'
                          }`}>
                            {chip.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="max-h-[550px] w-full min-w-0 overflow-y-auto">
                    {tasksLoading && tasks.length === 0 ? (
                      <div className="text-center p-8 text-gray-500 text-sm">
                        获取任务状态中...
                      </div>
                    ) : tasks.length === 0 ? (
                      <div className="text-center p-8 text-gray-500 text-xs">
                        暂无历史任务，请先在课程列表选择课程并提交。
                      </div>
                    ) : filteredTasks.length === 0 ? (
                      <div className="text-center p-12 text-gray-500 text-xs flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center text-muted-foreground">
                          <Activity className="w-6 h-6 stroke-[1.5]" />
                        </div>
                        <div>
                          {taskFilter === 'active' ? '暂无进行中的任务。' : '暂无已结束的任务。'}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 min-w-0 w-full">
                        {filteredTasks.map((task) => (
                          <TaskInlineItem
                            key={task.id}
                            task={task}
                            courseNameByIdentifier={courseNameByIdentifier}
                            onUnauthorized={onLogout}
                            onStopTask={handleStopTask}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column / Task listing and Log streams */}
        <div className="hidden lg:flex flex-col gap-6 min-w-0">
          <Card className="bg-card shadow-sm border-none min-w-0 w-full overflow-hidden">
            <CardHeader className="py-4 px-6 border-b border-border/50 flex flex-row items-start justify-between gap-3 space-y-0 min-w-0">
              <div className="min-w-0">
                <CardTitle className="text-base font-semibold">任务列表</CardTitle>
                <CardDescription className="text-xs wrap-anywhere">查看您的任务运行状态与进度</CardDescription>
              </div>
              <Button
                size="icon"
                variant="ghost"
                disabled={tasksLoading}
                onClick={() => void fetchTasks()}
                className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-[#2d2e30] shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${tasksLoading ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent className="p-0 min-w-0 w-full overflow-hidden">
              {/* Task Filter Chips */}
              {tasks.length > 0 && (
                <div className="flex gap-2 px-6 py-3 border-b border-border/40 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'active', label: '进行中', count: tasks.filter(t => isActiveTaskStatus(t.status)).length },
                    { id: 'completed', label: '已结束', count: tasks.filter(t => !isActiveTaskStatus(t.status)).length },
                  ].map(chip => (
                    <button
                      key={chip.id}
                      onClick={() => setTaskFilter(chip.id as 'active' | 'completed')}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        taskFilter === chip.id
                          ? 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#8ab4f8]/20 dark:text-[#8ab4f8]'
                          : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {chip.label}
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-sm ${
                        taskFilter === chip.id
                          ? 'bg-[#1a73e8]/15 text-[#1a73e8] dark:bg-[#8ab4f8]/30 dark:text-[#8ab4f8]'
                          : 'bg-muted-foreground/10 text-muted-foreground'
                      }`}>
                        {chip.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="max-h-[550px] w-full min-w-0 overflow-y-auto">
                {tasksLoading && tasks.length === 0 ? (
                  <div className="text-center p-8 text-gray-500 text-sm">
                    获取任务状态中...
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center p-8 text-gray-500 text-xs">
                    暂无历史任务，请先在课程列表选择课程并提交。
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center p-12 text-gray-500 text-xs flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center text-muted-foreground">
                      <Activity className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <div>
                      {taskFilter === 'active' ? '暂无进行中的任务。' : '暂无已结束的任务。'}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex flex-col gap-4 min-w-0 w-full">
                    {filteredTasks.map((task) => (
                      <TaskInlineItem
                        key={task.id}
                        task={task}
                        courseNameByIdentifier={courseNameByIdentifier}
                        onUnauthorized={onLogout}
                        onStopTask={handleStopTask}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </main>


      {/* Google M3 Floating Capsule Action Bar */}
      {selectedCourses.size > 0 && (
        <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-2.5 bg-card/95 backdrop-blur-md shadow-md rounded-lg animate-in slide-in-from-bottom-8 fade-in duration-300 border border-border">
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold bg-[#e8f0fe] dark:bg-[#adc6ff]/10 text-[#1a73e8] dark:text-[#adc6ff] rounded">
              {selectedCourses.size}
            </span>
            <span>已选择课程</span>
          </div>
          <div className="h-4 w-px bg-[#e1e3e4] dark:bg-[#333537]" />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-xs h-8 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d2e30] rounded-md px-3"
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={createTaskWithSelection}
              disabled={creatingTask}
              className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold h-8 px-4 rounded-md shadow-sm hover:shadow transition-colors flex items-center gap-1.5"
            >
              {creatingTask ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              提交并开始任务
            </Button>
          </div>
        </div>
      )}
      {/* Mobile Bottom Navigation Bar (MD3 Style with Fluent Design Transition) */}
      {(() => {
        const tabsList = ['courses', 'sign', 'tasks', 'settings'];
        const prevTabVal = prevTab;
        const prevIndex = tabsList.indexOf(prevTabVal);
        const currentIndex = tabsList.indexOf(activeTab);
        const distance = Math.abs(currentIndex - prevIndex);
        const isMovingRight = currentIndex > prevIndex;

        // 适当减慢时间，以便肉眼清晰捕捉回弹轨迹（1格260ms，2格300ms，3格340ms）
        const duration = distance === 0 ? 0 : 220 + distance * 40;
        // 时差拉伸，大跨度有更明显的拉伸和高速度体验
        const delay = distance * 22;

        // 采用回弹力度更显著的 Q 弹贝塞尔曲线 (overshoot 系数达 1.5)
        // cubic-bezier(0.25, 1.5, 0.45, 1.08) 在前边缘和后边缘的落点上都会产生显著的物理回弹
        const easing = 'cubic-bezier(0.25, 1.5, 0.45, 1.08)';

        const transitionStyle = distance === 0
          ? 'none'
          : isMovingRight
            ? `left ${duration}ms ${easing} ${delay}ms, right ${duration}ms ${easing} 0ms`
            : `left ${duration}ms ${easing} 0ms, right ${duration}ms ${easing} ${delay}ms`;

        const capsuleStyle: React.CSSProperties = {
          left: `calc(${currentIndex * 25}% + 12.5% - 28px)`,
          right: `calc(${(3 - currentIndex) * 25}% + 12.5% - 28px)`,
          transition: transitionStyle,
        };

        return (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex items-center py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-1px_3px_rgba(0,0,0,0.05)] px-0">
            {/* Sliding Capsule Background */}
            <div
              className="absolute top-2 h-8 rounded-full bg-accent pointer-events-none z-0"
              style={capsuleStyle}
            />
            {[
              { id: 'courses', icon: BookOpen, label: '课程' },
              { id: 'sign', icon: MapPin, label: '签到' },
              { id: 'tasks', icon: Activity, label: '任务' },
              { id: 'settings', icon: Settings, label: '设置' },
            ].map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className="flex-1 flex flex-col items-center justify-center gap-1 focus:outline-none relative z-10"
                >
                  <div
                    className={`flex items-center justify-center w-14 h-8 rounded-full transition-colors duration-200 ${
                      isActive
                        ? 'text-accent-foreground'
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'fill-current/10' : ''}`} />
                  </div>
                  <span
                    className={`text-[11px] transition-colors duration-200 ${
                      isActive ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};
