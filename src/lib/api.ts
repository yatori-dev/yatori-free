export const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://yatori-api.hungrym0.com';
export const TASK_PROGRESS_STREAM_EVENT = 'progress';

export interface ApiError extends Error {
  status?: number;
  payload?: unknown;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

export interface User {
  id: string;
  username: string;
  role: string;
}

export interface CoursesCustom {
  doChapterTest?: boolean;
  doWork?: boolean;
  doExam?: boolean;
  workAutoSubmit?: 0 | 1 | 2;
  examAutoSubmit?: 0 | 1 | 2;
  answerMode?: string;
  includeCourses?: string[];
  excludeCourses?: string[];
  coursesSettings?: CourseSetting[];
}

export interface CourseSetting {
  name?: string;
  includeExams?: string[];
  excludeExams?: string[];
}

export type TaskStatus =
  | 'pending'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'success'
  | 'failed'
  | 'partial_success';

export interface Account {
  id: string;
  ownerUserId: string;
  accountType: string;
  avatarUrl?: string;
  account: string;
  name: string;
  schoolName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  expiresAt: string | null;
  displayName: string;
  avatarUrl: string | null;
  schoolName?: string;
  user: User;
  account: Account | null;
}

export interface CurrentSessionData {
  expiresAt: string;
  user: User;
  accounts: Account[];
}

export interface Course {
  key: string;
  courseId?: string;
  courseTeacher?: string;
  courseName?: string;
  isstart?: boolean;
  state?: number;
  jobFinishCount?: number;
  jobCount?: number;
  jobRate?: number;
  processing?: boolean;
  processingTaskId?: string;
  blockedChapterCount?: number;
  blockedPointCount?: number;
}

export interface Chapter {
  name: string;
  id: number | string;
  label: string;
  PointTotal?: number;
  PointFinished?: number;
  pointTotal?: number;
  pointFinished?: number;
  status?: string;
  jobcount?: number;
  jobCount?: number;
  jobFinishCount?: number;
  openlock?: number;
  openLock?: number;
  totalCount?: number;
  finishCount?: number;
  unfinishCount?: number;
  isOpen?: boolean;
}

export interface CourseDetails {
  course: Course;
  chapters?: unknown;
  works?: unknown[];
  exams?: unknown[];
  blockedChapterCount?: number;
  blockedPointCount?: number;
}

export interface CourseListResponseData {
  courses: Course[];
}

export interface TaskListResponseData {
  tasks: Task[];
}

export interface CreateTaskRequest {
  accountId: string;
  autoResume?: boolean;
  coursesCustom: CoursesCustom;
}

export interface LoginRequest {
  account: string;
  password: string;
  name?: string;
}

export interface LoginData {
  expiresAt: string;
  displayName?: string;
  avatarUrl?: string;
  schoolName?: string;
  user: User;
  account: Account;
}

export interface Task {
  id: string;
  ownerUserId?: string;
  accountId: string;
  status: TaskStatus;
  autoResume: boolean;
  configSnapshot?: {
    accountType: string;
    account: string;
    coursesCustom: CoursesCustom;
  };
  startedAt: string | null;
  stoppedAt: string | null;
  errorMessage: string;
  progress?: TaskProgress;
  createdAt: string;
  updatedAt: string;
}

export interface TaskProgress {
  taskId: string;
  status: TaskStatus | string;
  percent: number;
  totalUnits?: number;
  completedUnits?: number;
  failedUnits?: number;
  currentCourse?: string;
  currentChapter?: string;
  currentKind?: string;
  currentTitle?: string;
  message: string;
  updatedAt?: string;
}

export function encodeApiPathSegment(value: string) {
  return encodeURIComponent(value);
}

export function getTaskProgressStreamUrl(taskId: string) {
  return `${API_BASE_URL}/tasks/${encodeApiPathSegment(taskId)}/progress/stream`;
}

export function getErrorMessage(error: unknown, fallback = '请求失败') {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function getApiErrorPayloadMessage(error: unknown) {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('payload' in error) ||
    typeof error.payload !== 'object' ||
    error.payload === null ||
    !('message' in error.payload) ||
    typeof error.payload.message !== 'string'
  ) {
    return null;
  }

  const message = error.payload.message.trim();
  return message || null;
}

export function getUserFacingErrorMessage(error: unknown, fallback = '请求失败') {
  const apiMessage = getApiErrorPayloadMessage(error);
  if (apiMessage) {
    return apiMessage;
  }

  if (isUnauthorizedError(error)) {
    return '登录已失效，请重新登录';
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
  ) {
    return fallback;
  }

  if (error instanceof TypeError) {
    return fallback;
  }

  return getErrorMessage(error, fallback);
}

export function isUnauthorizedError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 401
  );
}

export async function apiRequest<T = unknown>(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {};

  if (options.body && !('Content-Type' in (options.headers ?? {}))) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  const payload: ApiResponse<T> | null = await response.json().catch(() => null);

  const isBusinessError = payload && typeof payload.code === 'number' && ![200, 201].includes(payload.code);

  if (!response.ok || isBusinessError) {
    const error: ApiError = new Error(payload?.message || `请求失败 (${response.status})`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload as ApiResponse<T>;
}

export async function getCurrentSession() {
  const response = await apiRequest<CurrentSessionData>('/auth/me');
  const data = response.data;

  if (!data) {
    return null;
  }

  const account = data.accounts[0] ?? null;
  return {
    expiresAt: data.expiresAt,
    displayName: account?.name || data.user.username,
    avatarUrl: account?.avatarUrl || null,
    schoolName: account?.schoolName,
    user: data.user,
    account,
  } satisfies AuthSession;
}

export interface SignLog {
  id: string;
  courseName?: string;
  signName?: string;
  result: string;
  signInActivityId?: string;
  signOutActivityId?: string;
  signOutPublishAt?: string | null;
  createdAt: string;
}

export interface SignMonitorStatus {
  id: string;
  ownerUserId?: string;
  accountId: string;
  enabled: boolean;
  status: 'stopped' | 'running' | 'reconnecting' | 'failed';
  pollIntervalSeconds?: number;
  maxRunSeconds?: number;
  expiresAt?: string | null;
  lastError?: string;
  startedAt?: string | null;
  stoppedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SignLogsResponseData {
  logs: SignLog[];
  total: number;
  limit: number;
  offset: number;
}

export function login(payload: LoginRequest) {
  return apiRequest<LoginData>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getCourses(accountId: string) {
  return apiRequest<CourseListResponseData>(`/accounts/${encodeApiPathSegment(accountId)}/courses`);
}

export function getCourseDetails(accountId: string, classId: string) {
  return apiRequest<CourseDetails>(
    `/accounts/${encodeApiPathSegment(accountId)}/courses/${encodeApiPathSegment(classId)}`,
  );
}

export function getTasks() {
  return apiRequest<TaskListResponseData>('/tasks');
}

export function createTask(payload: CreateTaskRequest) {
  return apiRequest<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getTask(taskId: string) {
  return apiRequest<Task>(`/tasks/${encodeApiPathSegment(taskId)}`);
}

export function stopTask(taskId: string) {
  return apiRequest(`/tasks/${encodeApiPathSegment(taskId)}/stop`, {
    method: 'POST',
  });
}

export function startSignMonitor(accountId: string) {
  return apiRequest<SignMonitorStatus>(`/accounts/${encodeApiPathSegment(accountId)}/sign-monitor/start`, {
    method: 'POST',
  });
}

export function stopSignMonitor(accountId: string) {
  return apiRequest<SignMonitorStatus>(`/accounts/${encodeApiPathSegment(accountId)}/sign-monitor/stop`, {
    method: 'POST',
  });
}

export function getSignLogs(accountId: string, params: { limit?: number; offset?: number }) {
  const urlParams = new URLSearchParams();
  if (params.limit !== undefined) {
    urlParams.set('limit', params.limit.toString());
  }
  if (params.offset !== undefined) {
    urlParams.set('offset', params.offset.toString());
  }
  return apiRequest<SignLogsResponseData>(
    `/accounts/${encodeApiPathSegment(accountId)}/sign-logs?${urlParams.toString()}`,
  );
}
