export const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://yatori-api.hungrym0.com';

export interface ApiError extends Error {
  status?: number;
  payload?: unknown;
}

export interface ApiResponse {
  code: number;
  message?: string;
  error?: string;
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
  videoStudyMinutes?: number;
  readMinutes?: number;
}

export type TaskStatus =
  | 'pending'
  | 'running'
  | 'waiting_daily_limit'
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
  account: Account | null;
}

export interface VersionData {
  version: string;
  buildTime: string;
}

export interface Course {
  key: string;
  courseId?: string;
  courseTeacher?: string;
  beginDate?: string;
  endDate?: string;
  courseName: string;
  isstart?: boolean;
  state?: number;
  jobFinishCount?: number;
  jobCount?: number;
  jobRate?: number;
}

export interface CourseSummary extends Course {
  processing: boolean;
  processingTaskId?: string;
}

export type CourseTaskPointKind =
  | 'video'
  | 'audio'
  | 'chapter_test'
  | 'document'
  | 'reading'
  | 'hyperlink'
  | 'live'
  | 'discussion'
  | 'microcourse'
  | 'other';

export interface CourseTaskPoint {
  id: string;
  kind: CourseTaskPointKind;
  module: string;
  title: string;
  chapterId: number;
  chapterLabel: string;
  chapterName: string;
  cardIndex: number;
  iframeIndex: number;
  isTaskPoint: boolean;
  runnable: boolean;
  completed?: boolean;
}

export interface Chapter {
  name: string;
  id: number | string;
  label: string;
  pointTotal?: number;
  pointFinished?: number;
  status?: string;
  jobCount?: number;
  jobFinishCount?: number;
  openLock?: number;
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
  videoStudyMinutes?: number;
  readMinutes?: number;
}

export interface CourseWorkItem {
  id: string;
  runnable: boolean;
  title?: string;
  name?: string;
  status?: string | number;
  startDate?: string;
  endDate?: string;
  score?: string | number;
  [key: string]: unknown;
}

export interface CourseExamItem {
  id: string;
  runnable: boolean;
  title?: string;
  name?: string;
  status?: string | number;
  startDate?: string;
  endDate?: string;
  score?: string | number;
  [key: string]: unknown;
}

export interface CourseDetails {
  course: Course;
  processing?: boolean;
  processingTaskId?: string;
  chapters?: unknown;
  documents?: CourseDocument[];
  works?: CourseWorkItem[];
  exams?: CourseExamItem[];
  studyStats?: StudyStats;
  taskPoints?: CourseTaskPoint[];
  incomplete?: boolean;
}

export type CourseSourceStatusValue = 'ok' | 'failed' | 'skipped';

export interface CourseSourceStatus {
  joined: CourseSourceStatusValue;
  research: CourseSourceStatusValue;
}

export interface CourseListResponseData {
  courses: CourseSummary[];
  courseDetails: Record<string, CourseDetails>;
  sourceStatus: CourseSourceStatus;
  errors: Record<string, unknown>[];
}

interface CourseListApiResponseData {
  courses: Array<CourseDetails | null>;
  sourceStatus: CourseSourceStatus;
  errors: Record<string, unknown>[];
}

export interface TaskListResponseData {
  tasks: Task[];
}

export interface TaskCreationLimit {
  limit: number;
  remaining: number;
  resetAt: string | null;
}

export type TaskKind = 'task_points' | 'works' | 'exams';

export interface TaskTarget {
  classId: string;
  itemIds: string[];
}

export interface CreateTaskRequest {
  accountId: string;
  autoResume?: boolean;
  bypassDailyStudyLimit?: boolean;
  coursesCustom?: CoursesCustom;
  kind?: TaskKind;
  targets?: TaskTarget[];
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

export interface CreateSMSSessionRequest {
  phone: string;
}

export interface ExchangeSMSSessionRequest {
  code: string;
}

export interface SMSSessionData {
  id: string;
  status: 'pending';
  expiresAt: string;
  retryAfterSeconds: number;
}

export type QRSessionStatus = 'pending' | 'scanned' | 'confirmed' | 'expired' | 'failed';

export interface QRSessionData {
  id: string;
  status: QRSessionStatus;
  expiresAt: string;
  pollIntervalMs: number;
  qrContent?: string;
  scannedName?: string;
}

export interface Task {
  id: string;
  ownerUserId?: string;
  accountId: string;
  status: TaskStatus;
  autoResume: boolean;
  configSnapshot?: TaskConfigSnapshot;
  startedAt?: string | null;
  stoppedAt?: string | null;
  errorMessage?: string;
  progress?: TaskProgress;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskConfigSnapshot {
  account?: string;
  accountType?: string;
  bypassDailyStudyLimit?: boolean;
  coursesCustom?: CoursesCustom;
  kind?: TaskKind;
  targets?: TaskTarget[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string';
}

function isOptionalBoolean(value: unknown) {
  return value === undefined || typeof value === 'boolean';
}

function isOptionalTaskKind(value: unknown): value is TaskKind | undefined {
  return value === undefined || value === 'task_points' || value === 'works' || value === 'exams';
}

function isTaskTarget(value: unknown): value is TaskTarget {
  return isRecord(value)
    && typeof value.classId === 'string'
    && Array.isArray(value.itemIds)
    && value.itemIds.every((id) => typeof id === 'string');
}

function isOptionalTaskTargetArray(value: unknown): value is TaskTarget[] | undefined {
  return value === undefined || (Array.isArray(value) && value.every(isTaskTarget));
}

function isOptionalStringArray(value: unknown) {
  return value === undefined
    || (Array.isArray(value) && value.every((item) => typeof item === 'string'));
}

function isOptionalAutoSubmitMode(value: unknown) {
  return value === undefined || value === 0 || value === 1 || value === 2;
}

function isStudyIncrement(value: unknown): value is StudyIncrement {
  return isRecord(value)
    && ['visitCount', 'videoStudyMinutes', 'readMinutes'].every((key) => (
      value[key] === undefined || typeof value[key] === 'number'
    ));
}

function isCourseSetting(value: unknown): value is CourseSetting {
  return isRecord(value)
    && isOptionalString(value.classId)
    && isOptionalString(value.name)
    && isOptionalStringArray(value.includeExams)
    && isOptionalStringArray(value.excludeExams)
    && (value.studyIncrement === undefined || isStudyIncrement(value.studyIncrement));
}

function isCoursesCustom(value: unknown): value is CoursesCustom {
  return isRecord(value)
    && isOptionalBoolean(value.doChapterTest)
    && isOptionalBoolean(value.doWork)
    && isOptionalBoolean(value.doExam)
    && isOptionalAutoSubmitMode(value.workAutoSubmit)
    && isOptionalAutoSubmitMode(value.examAutoSubmit)
    && isOptionalString(value.answerMode)
    && isOptionalStringArray(value.includeCourses)
    && isOptionalStringArray(value.excludeCourses)
    && (value.coursesSettings === undefined || (
      Array.isArray(value.coursesSettings) && value.coursesSettings.every(isCourseSetting)
    ));
}

function isTaskConfigSnapshot(value: unknown): value is TaskConfigSnapshot {
  return isRecord(value)
    && isOptionalString(value.account)
    && isOptionalString(value.accountType)
    && isOptionalBoolean(value.bypassDailyStudyLimit)
    && isOptionalTaskKind(value.kind)
    && isOptionalTaskTargetArray(value.targets)
    && (value.coursesCustom === undefined || isCoursesCustom(value.coursesCustom));
}

export function getTaskConfigSnapshot(configSnapshot: Task['configSnapshot']) {
  return isTaskConfigSnapshot(configSnapshot) ? configSnapshot : undefined;
}

export function getTaskCoursesCustomSnapshot(configSnapshot: Task['configSnapshot']) {
  return getTaskConfigSnapshot(configSnapshot)?.coursesCustom;
}

export function getWorkItemTitle(item: CourseWorkItem) {
  return (item.title || item.name || `作业 #${item.id}`).trim();
}

export function getExamItemTitle(item: CourseExamItem) {
  return (item.title || item.name || `考试 #${item.id}`).trim();
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
  videoStudyMinutes: StudyMetricProgress;
  readMinutes: StudyMetricProgress;
}

export interface TaskProgress {
  totalUnits: number;
  completedUnits: number;
  failedUnits: number;
  unresolvedUnits: number;
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
    !isApiResponse(error.payload)
  ) {
    return null;
  }

  return getApiResponseMessage(error.payload);
}

export function getUserFacingErrorMessage(error: unknown, fallback = '请求失败') {
  if (isUnauthorizedError(error)) {
    return '登录信息已过期，请重新登录';
  }

  const apiMessage = getApiErrorPayloadMessage(error);
  if (apiMessage) {
    return apiMessage;
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
  return typeof payload.message === 'string' && payload.message.trim()
    ? payload.message.trim()
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

  const account = data.account;
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
  activityStatus?: number;
  activityTime?: string;
  personalStatus?: number | null;
  signInActivityId?: string;
  signOutActivityId?: string;
  signOutPublishAt?: string | null;
  signType?: string;
  signedCount?: number | null;
  submittedAt?: string;
  totalCount?: number | null;
  createdAt: string;
}

export interface SignHistoryError {
  classId: string;
  courseName: string;
  error: string;
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
  discoveryMode?: string;
  discoverySource?: string;
  nextRetryAt?: string | null;
  pendingReason?: string;
}

export interface SignLogsResponseData {
  logs: SignLog[];
  errors: SignHistoryError[];
}

export function login(payload: LoginRequest) {
  return apiRequest<LoginData>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, true);
}

export function createSMSSession(payload: CreateSMSSessionRequest) {
  return apiRequest<SMSSessionData>('/auth/sms-sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, true);
}

export function exchangeSMSSession(sessionId: string, payload: ExchangeSMSSessionRequest) {
  return apiRequest<LoginData>(
    `/auth/sms-sessions/${encodeApiPathSegment(sessionId)}/session`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function createQRSession() {
  return apiRequest<QRSessionData>('/auth/qr-sessions', {
    method: 'POST',
  }, true);
}

export function getQRSession(sessionId: string) {
  return apiRequest<QRSessionData>(
    `/auth/qr-sessions/${encodeApiPathSegment(sessionId)}`,
    undefined,
    true,
  );
}

export function exchangeQRSession(sessionId: string) {
  return apiRequest<LoginData>(
    `/auth/qr-sessions/${encodeApiPathSegment(sessionId)}/session`,
    { method: 'POST' },
    true,
  );
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
  return apiRequest<CourseListApiResponseData>(`/accounts/${encodeApiPathSegment(accountId)}/courses`, undefined, true)
    .then((response) => {
      const validCourses = response.data.courses.filter(
        (details): details is CourseDetails => details !== null && typeof details.course?.key === 'string',
      );
      const courseDetails = Object.fromEntries(
        validCourses.map((details) => [details.course.key, details]),
      );

      return {
        ...response,
        data: {
          courses: validCourses.map(({ course, processing = false, processingTaskId }) => ({
            ...course,
            processing,
            processingTaskId,
          })),
          courseDetails,
          sourceStatus: response.data.sourceStatus,
          errors: response.data.errors,
        },
      } satisfies ApiDataResponse<CourseListResponseData>;
    });
}

export function getCourseDocumentDownloadUrl(accountId: string, classId: string, documentId: string) {
  return `${API_BASE_URL}/accounts/${encodeApiPathSegment(accountId)}/courses/${encodeApiPathSegment(classId)}/documents/${encodeApiPathSegment(documentId)}/download`;
}

export function getTasks() {
  return apiRequest<TaskListResponseData>('/tasks', undefined, true);
}

export function getTaskCreationLimit() {
  return apiRequest<TaskCreationLimit>('/tasks/limit', undefined, true);
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

export function getSignLogs(accountId: string) {
  return apiRequest<SignLogsResponseData>(
    `/accounts/${encodeApiPathSegment(accountId)}/sign-logs`,
    undefined,
    true,
  );
}
