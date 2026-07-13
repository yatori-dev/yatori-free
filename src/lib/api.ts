export const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://yatori-api.hungrym0.com';

export interface ApiError extends Error {
  status?: number;
  payload?: unknown;
}

export interface ApiResponse {
  code: number;
}

export interface ApiDataResponse<T> extends ApiResponse {
  data: T;
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
  classId?: string;
  name?: string;
  includeExams?: string[];
  excludeExams?: string[];
  studyIncrement?: StudyIncrement;
}

export interface StudyIncrement {
  visitCount?: number;
  studyMinutes?: number;
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
  account: Account;
}

export interface CurrentSessionData {
  expiresAt: string;
  user: User;
  accounts: Account[];
}

export interface VersionData {
  version: string;
  buildTime: string;
}

export interface Course {
  key: string;
  courseId?: string;
  courseTeacher?: string;
  courseName: string;
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

export interface CourseDocument {
  id: string;
  name: string;
  type: 'word' | 'ppt' | 'pdf';
  extension: string;
  chapterId: number;
  chapterLabel?: string;
  chapterName?: string;
  downloadUrl: string;
  size?: number;
}

export interface StudyStats {
  available: boolean;
  fetchedAt: string;
  message: string;
  visitCount?: number;
  studyMinutes?: number;
}

export interface CourseDetails {
  course: Course;
  chapters?: unknown;
  documents?: CourseDocument[];
  works?: unknown[];
  exams?: unknown[];
  studyStats?: StudyStats;
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

export interface EmailNotificationSettings {
  available: boolean;
  email: string;
  pendingEmail: string;
  verified: boolean;
  enabled: boolean;
  verifiedAt: string | null;
}

export interface RequestEmailVerificationRequest {
  email: string;
}

export interface ConfirmEmailVerificationRequest {
  code: string;
}

export interface UpdateEmailNotificationRequest {
  enabled: boolean;
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
  startedAt?: string | null;
  stoppedAt?: string | null;
  errorMessage?: string;
  progress?: TaskProgress;
  createdAt?: string;
  updatedAt?: string;
}

export type StudyMetricStatus = 'disabled' | 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface StudyMetricProgress {
  baseline: number;
  current: number;
  target: number;
  status: StudyMetricStatus;
  message: string;
}

export interface CourseStudyProgress {
  classId: string;
  courseName: string;
  visitCount: StudyMetricProgress;
  studyMinutes: StudyMetricProgress;
}

export interface TaskProgress {
  totalUnits: number;
  completedUnits: number;
  failedUnits: number;
  currentCourse?: string;
  currentChapter?: string;
  currentKind?: string;
  currentTitle?: string;
  message: string;
  studyProgress?: CourseStudyProgress[];
  updatedAt?: string;
}

export function encodeApiPathSegment(value: string) {
  return encodeURIComponent(value);
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

export function isForbiddenError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 403
  );
}

export function isAuthExitError(error: unknown) {
  return isUnauthorizedError(error) || isForbiddenError(error);
}

function isApiResponse(payload: unknown): payload is ApiResponse {
  return (
    typeof payload === 'object'
    && payload !== null
    && 'code' in payload
    && typeof payload.code === 'number'
    && Number.isFinite(payload.code)
  );
}

function getApiResponseMessage(payload: ApiResponse) {
  return 'message' in payload && typeof payload.message === 'string'
    ? payload.message
    : null;
}

function createApiError(message: string, status: number, payload?: unknown): ApiError {
  const error: ApiError = new Error(message);
  error.status = status;
  error.payload = payload;
  return error;
}

export function apiRequest(path: string, options?: RequestInit): Promise<ApiResponse>;
export function apiRequest<T>(path: string, options: RequestInit | undefined, requireData: true): Promise<ApiDataResponse<T>>;
export async function apiRequest<T>(path: string, options: RequestInit = {}, requireData = false) {
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

  const rawBody = await response.text();
  let payload: unknown = null;

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw createApiError(`接口响应不是 JSON (${response.status})`, response.status);
    }
  }

  if (!isApiResponse(payload)) {
    throw createApiError(`接口响应不符合约定 (${response.status})`, response.status, payload);
  }

  if (!response.ok || ![200, 201].includes(payload.code)) {
    throw createApiError(getApiResponseMessage(payload) || `请求失败 (${response.status})`, response.status, payload);
  }

  if (requireData && !('data' in payload)) {
    throw createApiError(`接口响应缺少 data (${response.status})`, response.status, payload);
  }

  return payload as ApiResponse | ApiDataResponse<T>;
}

export async function getCurrentSession() {
  const response = await apiRequest<CurrentSessionData>('/auth/me', undefined, true);
  const data = response.data;

  const account = data.accounts[0];
  if (!account) {
    throw new Error('当前会话未关联账号，请重新登录');
  }

  return {
    expiresAt: data.expiresAt,
    displayName: account.name,
    avatarUrl: account.avatarUrl ?? null,
    schoolName: account.schoolName,
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
  }, true);
}

export function logout() {
  return apiRequest('/auth/logout', {
    method: 'POST',
  });
}

export function getVersion() {
  return apiRequest<VersionData>('/version', undefined, true);
}

export function getCourses(accountId: string) {
  return apiRequest<CourseListResponseData>(`/accounts/${encodeApiPathSegment(accountId)}/courses`, undefined, true);
}

export function getCourseDetails(accountId: string, classId: string) {
  return apiRequest<CourseDetails>(
    `/accounts/${encodeApiPathSegment(accountId)}/courses/${encodeApiPathSegment(classId)}`,
    undefined,
    true,
  );
}

export function getCourseDocumentDownloadUrl(accountId: string, classId: string, documentId: string) {
  return `${API_BASE_URL}/accounts/${encodeApiPathSegment(accountId)}/courses/${encodeApiPathSegment(classId)}/documents/${encodeApiPathSegment(documentId)}/download`;
}

export function getTasks() {
  return apiRequest<TaskListResponseData>('/tasks', undefined, true);
}

export function createTask(payload: CreateTaskRequest) {
  return apiRequest<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, true);
}

export function getTask(taskId: string) {
  return apiRequest<Task>(`/tasks/${encodeApiPathSegment(taskId)}`, undefined, true);
}

export function stopTask(taskId: string) {
  return apiRequest(`/tasks/${encodeApiPathSegment(taskId)}/stop`, {
    method: 'POST',
  });
}

export function getEmailNotificationSettings() {
  return apiRequest<EmailNotificationSettings>('/notifications/email', undefined, true);
}

export function requestEmailVerification(payload: RequestEmailVerificationRequest) {
  return apiRequest<EmailNotificationSettings>('/notifications/email/verification', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, true);
}

export function confirmEmailVerification(payload: ConfirmEmailVerificationRequest) {
  return apiRequest<EmailNotificationSettings>('/notifications/email/verification/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, true);
}

export function updateEmailNotification(payload: UpdateEmailNotificationRequest) {
  return apiRequest<EmailNotificationSettings>('/notifications/email', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, true);
}

export function deleteEmailNotification() {
  return apiRequest('/notifications/email', {
    method: 'DELETE',
  });
}

export function startSignMonitor(accountId: string) {
  return apiRequest<SignMonitorStatus>(`/accounts/${encodeApiPathSegment(accountId)}/sign-monitor/start`, {
    method: 'POST',
  }, true);
}

export function stopSignMonitor(accountId: string) {
  return apiRequest<SignMonitorStatus>(`/accounts/${encodeApiPathSegment(accountId)}/sign-monitor/stop`, {
    method: 'POST',
  }, true);
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
    undefined,
    true,
  );
}
