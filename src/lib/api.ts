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
  answerMode?: '' | 'xxt' | 'builtin' | 'internal';
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
  avatarUrl?: string | null;
  account: string;
  name: string;
  schoolName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  expiresAt: string | null;
  displayName: string;
  avatarUrl: string | null;
  schoolName?: string | null;
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
  ContentID?: number;
  courseId?: string;
  chatId?: string;
  courseDataId?: number;
  courseImage?: string;
  courseTeacher?: string | null;
  cpi?: number;
  beginDate?: string;
  endDate?: string;
  courseName: string;
  isstart?: boolean;
  state?: 0 | 1;
  jobFinishCount?: number;
  jobCount?: number;
  jobRate?: number;
}

export interface CourseSummary extends Course {
  processing: boolean;
  processingTaskId: string;
}

export interface ChapterNode {
  id: number;
  parentnodeid: number;
  name: string;
  label: string;
  indexorder: number;
  layer: number;
  status: string;
  jobcount: number;
  isreview: number;
  attachment: unknown[] | null;
  begintime?: string;
  openlock?: number;
  pointFinished?: number;
  pointTotal?: number;
}

export interface CourseChapters {
  chatid: string;
  isstart: boolean;
  bbsid: string;
  knowledge: ChapterNode[] | null;
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
  name: string;
  status: string;
  createdAt?: number;
  openAt?: number;
  endAt?: number;
  finishStandard?: string;
  remain_time?: string;
}

export interface CourseExamItem {
  id: string;
  runnable: boolean;
  name: string;
  status: string;
  createdAt?: number;
  openAt?: number;
  endAt?: number;
  finishStandard?: string;
  remain_time?: string;
}

export interface CourseDetails {
  course: Course;
  processing?: boolean;
  processingTaskId?: string;
  chapters?: CourseChapters;
  documents?: CourseDocument[] | null;
  works?: CourseWorkItem[] | null;
  exams?: CourseExamItem[] | null;
  studyStats?: StudyStats;
  taskPoints?: CourseTaskPoint[] | null;
  incomplete?: boolean;
  blockedChapterCount?: number;
  blockedPointCount?: number;
  hasReadTaskPoints?: boolean;
  partialReasons?: string[];
  readTaskPointCount?: number;
  taskPointCount?: number;
  taskPointsIncomplete?: boolean;
  worksError?: string;
  examsError?: string;
}

export type CourseSourceStatusValue = 'ok' | 'failed' | 'skipped';

export interface CourseSourceStatus {
  joined: CourseSourceStatusValue;
}

export interface CourseListResponseData {
  courses: CourseSummary[];
  sourceStatus: CourseSourceStatus;
  errors: Record<string, unknown>[];
}

interface CourseListApiResponseData {
  courses: Array<{ course: Course; processing: boolean; processingTaskId: string }>;
  sourceStatus: CourseSourceStatus;
  errors: Record<string, unknown>[];
}

function isCourseListApiResponseData(value: unknown): value is CourseListApiResponseData {
  if (!isRecord(value) || !Array.isArray(value.courses) || !isRecord(value.sourceStatus) || !Array.isArray(value.errors) || !value.errors.every(isRecord)) {
    return false;
  }

  return value.sourceStatus.joined === 'ok'
    || value.sourceStatus.joined === 'failed'
    || value.sourceStatus.joined === 'skipped';
}

function getCourseListSourceError(errors: Record<string, unknown>[]) {
  const detail = errors.find((error) => typeof error.message === 'string' || typeof error.error === 'string');
  const message = detail
    ? typeof detail.message === 'string'
      ? detail.message
      : typeof detail.error === 'string'
        ? detail.error
        : null
    : null;
  return message?.trim() ? `课程读取失败：${message.trim()}` : '课程源读取失败，请稍后重试';
}

export interface CourseTaskListItem<T> {
  course: Course;
  items: T[] | null;
  error?: string;
}

export interface CourseTaskListResponseData<T> {
  courses: CourseTaskListItem<T>[];
  sourceStatus: CourseSourceStatus;
}

export interface TaskListResponseData {
  tasks: TaskSummary[];
}

export type TaskKind = 'task_points' | 'works' | 'exams';

export interface TaskTarget {
  classId: string;
  itemIds: string[];
}

interface CreateTaskBase {
  accountId: string;
  autoResume?: boolean;
  bypassDailyStudyLimit?: boolean;
  coursesCustom?: CoursesCustom;
}

export type CreateTaskRequest = CreateTaskBase & (
  | {
      kind: TaskKind;
      targets: TaskTarget[];
    }
  | {
      kind?: '';
      coursesCustom: CoursesCustom;
      targets?: TaskTarget[];
    }
);

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
  avatarUrl?: string | null;
  schoolName?: string | null;
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

export type TaskSummary = Omit<Task, 'configSnapshot'>;

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

function isOptionalTaskKind(value: unknown): value is TaskKind | undefined {
  return value === undefined || value === 'task_points' || value === 'works' || value === 'exams';
}

function isTaskTarget(value: unknown): value is TaskTarget {
  return isRecord(value)
    && typeof value.classId === 'string'
    && Array.isArray(value.itemIds)
    && value.itemIds.every((id) => typeof id === 'string');
}

function isTaskConfigSnapshot(value: unknown): value is TaskConfigSnapshot {
  return isRecord(value);
}

export function getTaskConfigSnapshot(configSnapshot: Task['configSnapshot']) {
  if (!isTaskConfigSnapshot(configSnapshot)) {
    return undefined;
  }

  // Preserve usable server fields when an older response adds an incompatible
  // optional field; a single mismatch must not hide the course scope.
  const snapshot: TaskConfigSnapshot = {};
  if (typeof configSnapshot.account === 'string') snapshot.account = configSnapshot.account;
  if (typeof configSnapshot.accountType === 'string') snapshot.accountType = configSnapshot.accountType;
  if (typeof configSnapshot.bypassDailyStudyLimit === 'boolean') snapshot.bypassDailyStudyLimit = configSnapshot.bypassDailyStudyLimit;
  if (isOptionalTaskKind(configSnapshot.kind)) snapshot.kind = configSnapshot.kind;
  if (Array.isArray(configSnapshot.targets)) {
    const targets = configSnapshot.targets.filter(isTaskTarget);
    if (targets.length > 0 || configSnapshot.targets.length === 0) snapshot.targets = targets;
  }
  if (isRecord(configSnapshot.coursesCustom)) {
    snapshot.coursesCustom = configSnapshot.coursesCustom as CoursesCustom;
  }
  return snapshot;
}

export function getTaskCoursesCustomSnapshot(configSnapshot: Task['configSnapshot']) {
  return getTaskConfigSnapshot(configSnapshot)?.coursesCustom;
}

export function getTaskCourseIdentifiers(configSnapshot: Task['configSnapshot']) {
  const config = getTaskConfigSnapshot(configSnapshot);
  const includedCourses = config?.coursesCustom?.includeCourses;
  if (includedCourses && includedCourses.length > 0) {
    return includedCourses;
  }

  return config?.targets?.map(({ classId }) => classId) ?? undefined;
}

export function getWorkItemTitle(item: CourseWorkItem) {
  return (item.name || `作业 #${item.id}`).trim();
}

export function getExamItemTitle(item: CourseExamItem) {
  return (item.name || `考试 #${item.id}`).trim();
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
      if (!isCourseListApiResponseData(response.data)) {
        throw new Error('课程接口响应结构异常，请稍后重试');
      }
      if (response.data.sourceStatus.joined !== 'ok') {
        throw new Error(getCourseListSourceError(response.data.errors));
      }

      const validCourses = response.data.courses.map((item) => {
        if (!isRecord(item) || !isRecord(item.course) || typeof item.course.key !== 'string' || typeof item.course.courseName !== 'string' || typeof item.processing !== 'boolean' || typeof item.processingTaskId !== 'string') {
          throw new Error('课程接口响应结构异常，请稍后重试');
        }
        return item as { course: Course; processing: boolean; processingTaskId: string };
      });

      return {
        ...response,
        data: {
          courses: validCourses.map(({ course, processing, processingTaskId }) => ({
            ...course,
            processing,
            processingTaskId,
          })),
          sourceStatus: response.data.sourceStatus,
          errors: response.data.errors,
        },
      } satisfies ApiDataResponse<CourseListResponseData>;
    });
}

export function getCourseDetails(accountId: string, classId: string) {
  return apiRequest<CourseDetails>(
    `/accounts/${encodeApiPathSegment(accountId)}/courses/${encodeApiPathSegment(classId)}`,
    undefined,
    true,
  );
}

function getCourseTaskList<T>(accountId: string, kind: 'works' | 'exams') {
  return apiRequest<CourseTaskListResponseData<T>>(
    `/accounts/${encodeApiPathSegment(accountId)}/${kind}`,
    undefined,
    true,
  );
}

export function getWorks(accountId: string) {
  return getCourseTaskList<CourseWorkItem>(accountId, 'works');
}

export function getExams(accountId: string) {
  return getCourseTaskList<CourseExamItem>(accountId, 'exams');
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
