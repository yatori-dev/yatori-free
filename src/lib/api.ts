const DEFAULT_API_BASE_URL = 'https://yatori-api.hungrym0.com';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (import.meta.env.DEV ? '/api' : DEFAULT_API_BASE_URL);

export interface ApiError extends Error {
  status?: number;
  payload?: unknown;
  kind?: 'timeout' | 'aborted';
}

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
  refresh?: boolean;
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
  createdAt: string;
  updatedAt: string;
}

export interface CoursesCustom {
  doChapterTest?: boolean;
  doWork?: boolean;
  doExam?: boolean;
  workAutoSubmit?: 0 | 1;
  examAutoSubmit?: 0 | 1;
  workAutoSubmitBeforeDeadlineMinutes?: number;
  forceAggressiveBeforeCourseEndHours?: number;
  includeCourses?: string[];
  excludeCourses?: string[];
  coursesSettings?: CourseSetting[];
}

export type CreateTaskCoursesCustom = Pick<
  CoursesCustom,
  | 'workAutoSubmit'
  | 'examAutoSubmit'
  | 'workAutoSubmitBeforeDeadlineMinutes'
  | 'forceAggressiveBeforeCourseEndHours'
  | 'coursesSettings'
>;

export interface CourseSetting {
  classId?: string;
  name?: string;
  includeExams?: string[];
  excludeExams?: string[];
}

export type TaskStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'waiting_daily_limit'
  | 'stopping'
  | 'stopped'
  | 'success'
  | 'failed';

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
  canRedo?: boolean;
  remainingRedoTimes?: number | null;
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
  canRedo?: boolean;
  remainingRedoTimes?: number | null;
}

export interface CourseDetails {
  course: Course;
  processing?: boolean;
  processingTaskId?: string;
  chapters?: CourseChapters;
  documents?: CourseDocument[] | null;
  works?: CourseWorkItem[] | null;
  exams?: CourseExamItem[] | null;
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
  courses: Array<{
    course: Course;
    processing: boolean;
    processingTaskId: string;
  }>;
  sourceStatus: CourseSourceStatus;
  errors: Record<string, unknown>[];
}

function isCourseListApiResponseData(
  value: unknown,
): value is CourseListApiResponseData {
  if (
    !isRecord(value) ||
    !Array.isArray(value.courses) ||
    !isRecord(value.sourceStatus) ||
    !Array.isArray(value.errors) ||
    !value.errors.every(isRecord)
  ) {
    return false;
  }

  return (
    value.sourceStatus.joined === 'ok' ||
    value.sourceStatus.joined === 'failed' ||
    value.sourceStatus.joined === 'skipped'
  );
}

function getCourseListSourceError(errors: Record<string, unknown>[]) {
  const detail = errors.find(
    (error) =>
      typeof error.message === 'string' || typeof error.error === 'string',
  );
  const message = detail
    ? typeof detail.message === 'string'
      ? detail.message
      : typeof detail.error === 'string'
        ? detail.error
        : null
    : null;
  return message?.trim()
    ? `课程读取失败：${message.trim()}`
    : '课程源读取失败，请稍后重试';
}

export interface CourseTaskListItem<T> {
  course: Course;
  items: T[] | null;
  error?: string;
}

export interface CourseWorkListResponseData {
  courses: CourseTaskListItem<CourseWorkItem>[];
  sourceStatus: CourseSourceStatus;
}

export interface CourseExamListResponseData {
  courses: CourseTaskListItem<CourseExamItem>[];
  sourceStatus: CourseSourceStatus;
}

export interface TaskListResponseData {
  tasks: TaskSummary[];
  page: number;
  pageSize: number;
  total: number;
}

export interface TaskListQuery {
  group?: 'active' | 'completed';
  status?: TaskStatus | 'attention';
  kind?: TaskKind;
  q?: string;
  sort?: 'newest' | 'oldest';
  page?: number;
  pageSize?: number;
}

export interface TaskStats {
  total: number;
  statusCounts: Record<string, number>;
  creationHistory: Array<{ date: string; count: number }>;
}

export type TaskKind = 'task_points' | 'works' | 'exams';
export type TaskSnapshotKind = '' | TaskKind;

export type TaskExecutionMode = 'normal' | 'aggressive';

export interface TaskTarget {
  classId: string;
  itemIds: string[];
}

interface CreateTaskBase {
  accountId: string;
  autoResume?: boolean;
  executionMode?: TaskExecutionMode;
  coursesCustom?: CreateTaskCoursesCustom;
}

export type CreateTaskRequest = CreateTaskBase & {
  kind: TaskKind;
  targets: TaskTarget[];
};

export interface EmailNotificationSettings {
  available: boolean;
  email: string;
  pendingEmail: string;
  verified: boolean;
  enabled: boolean;
  verifiedAt: string | null;
  deadlineReminderMinutes: number[];
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

export interface UpdateDeadlineEmailNotificationRequest {
  reminderMinutes: number[];
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
  turnstileToken?: string;
}

export interface SMSTurnstileConfig {
  enabled: boolean;
  siteKey: string;
  action: 'sms_send';
}

export interface SMSConfig {
  turnstile: SMSTurnstileConfig;
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

export type QRSessionStatus =
  | 'pending'
  | 'scanned'
  | 'confirmed'
  | 'expired'
  | 'failed';

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
  kind?: TaskSnapshotKind;
  courseNames?: string[];
  courseIdentifiers?: string[];
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
  executionMode?: TaskExecutionMode;
  coursesCustom?: CoursesCustom;
  kind?: TaskSnapshotKind;
  targets?: TaskTarget[] | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOptionalTaskKind(value: unknown): value is TaskSnapshotKind | undefined {
  return (
    value === undefined ||
    value === '' ||
    value === 'task_points' ||
    value === 'works' ||
    value === 'exams'
  );
}

function isTaskTarget(value: unknown): value is TaskTarget {
  return (
    isRecord(value) &&
    typeof value.classId === 'string' &&
    Array.isArray(value.itemIds) &&
    value.itemIds.every((id) => typeof id === 'string')
  );
}

function isTaskConfigSnapshot(value: unknown): value is TaskConfigSnapshot {
  return isRecord(value);
}

export function getTaskConfigSnapshot(configSnapshot: Task['configSnapshot']) {
  if (!isTaskConfigSnapshot(configSnapshot)) {
    return undefined;
  }

  const snapshot: TaskConfigSnapshot = {};
  if (typeof configSnapshot.account === 'string')
    snapshot.account = configSnapshot.account;
  if (typeof configSnapshot.accountType === 'string')
    snapshot.accountType = configSnapshot.accountType;
  if (
    configSnapshot.executionMode === 'normal' ||
    configSnapshot.executionMode === 'aggressive'
  )
    snapshot.executionMode = configSnapshot.executionMode;
  if (isOptionalTaskKind(configSnapshot.kind))
    snapshot.kind = configSnapshot.kind;
  if (Array.isArray(configSnapshot.targets)) {
    const targets = configSnapshot.targets.filter(isTaskTarget);
    if (targets.length > 0 || configSnapshot.targets.length === 0)
      snapshot.targets = targets;
  }
  if (isRecord(configSnapshot.coursesCustom)) {
    snapshot.coursesCustom = configSnapshot.coursesCustom as CoursesCustom;
  }
  return snapshot;
}

export function getTaskCoursesCustomSnapshot(
  configSnapshot: Task['configSnapshot'],
) {
  return getTaskConfigSnapshot(configSnapshot)?.coursesCustom;
}

export function getTaskCourseIdentifiers(
  source: Task['configSnapshot'] | Pick<Task, 'courseIdentifiers' | 'configSnapshot'>,
) {
  if (!source) {
    return undefined;
  }
  if ('courseIdentifiers' in source && Array.isArray(source.courseIdentifiers)) {
    return source.courseIdentifiers;
  }
  const configSnapshot = 'configSnapshot' in source
    ? source.configSnapshot
    : source as TaskConfigSnapshot;
  const config = getTaskConfigSnapshot(configSnapshot);
  const includedCourses = config?.coursesCustom?.includeCourses;
  if (includedCourses && includedCourses.length > 0) {
    return includedCourses;
  }

  return config?.targets?.map(({ classId }) => classId) ?? undefined;
}

export function getTaskKind(task: Pick<Task, 'kind' | 'configSnapshot'>) {
  return task.kind || getTaskConfigSnapshot(task.configSnapshot)?.kind || '';
}

export function getWorkItemTitle(item: CourseWorkItem) {
  return (item.name || `作业 #${item.id}`).trim();
}

export function getExamItemTitle(item: CourseExamItem) {
  return (item.name || `考试 #${item.id}`).trim();
}

export interface TaskProgress {
  totalUnits: number;
  completedUnits: number;
  failedUnits: number;
  unresolvedUnits: number;
  unfinishedUnits?: number;
  failedTaskPoints?: number;
  failedWorks?: number;
  failedExams?: number;
  unresolvedTaskPoints?: number;
  unresolvedWorks?: number;
  unresolvedExams?: number;
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

export function getUserFacingErrorMessage(
  error: unknown,
  fallback = '请求失败',
) {
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
    typeof payload === 'object' &&
    payload !== null &&
    'code' in payload &&
    typeof payload.code === 'number' &&
    Number.isFinite(payload.code)
  );
}

function getApiResponseMessage(payload: ApiResponse) {
  return typeof payload.message === 'string' && payload.message.trim()
    ? payload.message.trim()
    : null;
}

function createApiError(
  message: string,
  status: number,
  payload?: unknown,
): ApiError {
  const error: ApiError = new Error(message);
  error.status = status;
  error.payload = payload;
  return error;
}

const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

export function apiRequest(
  path: string,
  options?: ApiRequestOptions,
): Promise<ApiResponse>;
export function apiRequest<T>(
  path: string,
  options: ApiRequestOptions | undefined,
  requireData: true,
): Promise<ApiDataResponse<T>>;
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
  requireData = false,
) {
  const headers: Record<string, string> = {};
  const {
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    signal: callerSignal,
    ...requestInit
  } = options;
  const controller = new AbortController();
  let timedOut = false;
  let callerAborted = callerSignal?.aborted === true;
  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const abortFromCaller = () => {
    callerAborted = true;
    controller.abort();
  };
  callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
  if (callerAborted) {
    controller.abort();
  }

  if (requestInit.body && !('Content-Type' in (requestInit.headers ?? {}))) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestInit,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        ...headers,
        ...requestInit.headers,
      },
    });

    const rawBody = await response.text();
    let payload: unknown = null;

    if (rawBody) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        throw createApiError(
          `接口响应不是 JSON (${response.status})`,
          response.status,
        );
      }
    }

    if (!isApiResponse(payload)) {
      throw createApiError(
        `接口响应不符合约定 (${response.status})`,
        response.status,
        payload,
      );
    }

    if (!response.ok || ![200, 201].includes(payload.code)) {
      throw createApiError(
        getApiResponseMessage(payload) || `请求失败 (${response.status})`,
        response.status,
        payload,
      );
    }

    if (requireData && !('data' in payload)) {
      throw createApiError(
        `接口响应缺少 data (${response.status})`,
        response.status,
        payload,
      );
    }

    return payload as ApiResponse | ApiDataResponse<T>;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      const aborted = createApiError(
        timedOut ? `请求超时 (${timeoutMs}ms)` : '请求已取消',
        0,
      );
      aborted.kind = timedOut
        ? 'timeout'
        : callerAborted
          ? 'aborted'
          : 'aborted';
      throw aborted;
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
    callerSignal?.removeEventListener('abort', abortFromCaller);
  }
}

export async function getCurrentSession() {
  const response = await apiRequest<CurrentSessionData>(
    '/auth/me',
    undefined,
    true,
  );
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

export function login(payload: LoginRequest) {
  return apiRequest<LoginData>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function createSMSSession(
  payload: CreateSMSSessionRequest,
  options?: ApiRequestOptions,
) {
  return apiRequest<SMSSessionData>(
    '/auth/sms-sessions',
    {
      ...options,
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function getSMSConfig(options?: ApiRequestOptions) {
  return apiRequest<SMSConfig>('/auth/sms-config', options, true).then((response) => {
    const config = isRecord(response.data) ? response.data.turnstile : undefined;
    if (
      !isRecord(config) ||
      typeof config.enabled !== 'boolean' ||
      typeof config.siteKey !== 'string' ||
      config.action !== 'sms_send' ||
      (config.enabled && !config.siteKey.trim())
    ) {
      throw new Error('短信验证配置异常，请重试');
    }
    return response;
  });
}

export function exchangeSMSSession(
  sessionId: string,
  payload: ExchangeSMSSessionRequest,
  options?: ApiRequestOptions,
) {
  return apiRequest<LoginData>(
    `/auth/sms-sessions/${encodeApiPathSegment(sessionId)}/session`,
    {
      ...options,
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function createQRSession(options?: ApiRequestOptions) {
  return apiRequest<QRSessionData>(
    '/auth/qr-sessions',
    {
      ...options,
      method: 'POST',
    },
    true,
  );
}

export function getQRSession(sessionId: string, options?: ApiRequestOptions) {
  return apiRequest<QRSessionData>(
    `/auth/qr-sessions/${encodeApiPathSegment(sessionId)}`,
    options,
    true,
  );
}

export function exchangeQRSession(
  sessionId: string,
  options?: ApiRequestOptions,
) {
  return apiRequest<LoginData>(
    `/auth/qr-sessions/${encodeApiPathSegment(sessionId)}/session`,
    { ...options, method: 'POST' },
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

function getCourseResource<T>(path: string, options?: ApiRequestOptions) {
  const { refresh, ...requestOptions } = options ?? {};
  return apiRequest<T>(
    refresh ? `${path}?refresh=true` : path,
    requestOptions,
    true,
  );
}

export function getCourses(accountId: string, options?: ApiRequestOptions) {
  return getCourseResource<CourseListApiResponseData>(
    `/accounts/${encodeApiPathSegment(accountId)}/courses`,
    options,
  ).then((response) => {
    if (!isCourseListApiResponseData(response.data)) {
      throw new Error('课程接口响应结构异常，请稍后重试');
    }
    if (response.data.sourceStatus.joined !== 'ok') {
      throw new Error(getCourseListSourceError(response.data.errors));
    }

    const validCourses = response.data.courses.map((item) => {
      if (
        !isRecord(item) ||
        !isRecord(item.course) ||
        typeof item.course.key !== 'string' ||
        typeof item.course.courseName !== 'string' ||
        typeof item.processing !== 'boolean' ||
        typeof item.processingTaskId !== 'string'
      ) {
        throw new Error('课程接口响应结构异常，请稍后重试');
      }
      return item as {
        course: Course;
        processing: boolean;
        processingTaskId: string;
      };
    });

    return {
      ...response,
      data: {
        courses: validCourses.map(
          ({ course, processing, processingTaskId }) => ({
            ...course,
            processing,
            processingTaskId,
          }),
        ),
        sourceStatus: response.data.sourceStatus,
        errors: response.data.errors,
      },
    } satisfies ApiDataResponse<CourseListResponseData>;
  });
}

export function getCourseDetails(
  accountId: string,
  classId: string,
  options?: ApiRequestOptions,
) {
  return apiRequest<CourseDetails>(
    `/accounts/${encodeApiPathSegment(accountId)}/courses/${encodeApiPathSegment(classId)}`,
    options,
    true,
  );
}

export function getCourseOutline(
  accountId: string,
  classId: string,
  options?: ApiRequestOptions,
) {
  return getCourseResource<CourseDetails>(
    `/accounts/${encodeApiPathSegment(accountId)}/courses/${encodeApiPathSegment(classId)}/outline`,
    options,
  );
}

export function getCourseChapterDetails(
  accountId: string,
  classId: string,
  chapterId: number | string,
  options?: ApiRequestOptions,
) {
  return getCourseResource<CourseDetails>(
    `/accounts/${encodeApiPathSegment(accountId)}/courses/${encodeApiPathSegment(classId)}/chapters/${encodeApiPathSegment(String(chapterId))}`,
    options,
  );
}

function getCourseTaskList<TResponse>(
  accountId: string,
  kind: 'works' | 'exams',
  options?: ApiRequestOptions,
): Promise<ApiDataResponse<TResponse>> {
  return getCourseResource<TResponse>(
    `/accounts/${encodeApiPathSegment(accountId)}/${kind}`,
    options,
  );
}

export function getWorks(accountId: string, options?: ApiRequestOptions) {
  return getCourseTaskList<CourseWorkListResponseData>(accountId, 'works', options);
}

export function getExams(accountId: string, options?: ApiRequestOptions) {
  return getCourseTaskList<CourseExamListResponseData>(accountId, 'exams', options);
}

export function getCourseDocumentDownloadUrl(
  accountId: string,
  classId: string,
  documentId: string,
) {
  return `${API_BASE_URL}/accounts/${encodeApiPathSegment(accountId)}/courses/${encodeApiPathSegment(classId)}/documents/${encodeApiPathSegment(documentId)}/download`;
}

export function getTasks(options?: ApiRequestOptions): Promise<ApiDataResponse<TaskListResponseData>>;
export function getTasks(query: TaskListQuery, options?: ApiRequestOptions): Promise<ApiDataResponse<TaskListResponseData>>;
export function getTasks(
  queryOrOptions: TaskListQuery | ApiRequestOptions = {},
  options?: ApiRequestOptions,
) {
  const queryKeys: Array<keyof TaskListQuery> = [
    'group', 'status', 'kind', 'q', 'sort', 'page', 'pageSize',
  ];
  const hasQuery = queryKeys.some((key) => key in queryOrOptions);
  const query = hasQuery ? queryOrOptions as TaskListQuery : {};
  const search = new URLSearchParams();
  for (const key of queryKeys) {
    const value = query[key];
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const suffix = search.size > 0 ? `?${search.toString()}` : '';
  return apiRequest<TaskListResponseData>(
    `/tasks${suffix}`,
    options ?? (hasQuery ? undefined : queryOrOptions as ApiRequestOptions),
    true,
  );
}

export function getTaskStats(options?: ApiRequestOptions) {
  return apiRequest<TaskStats>('/tasks/stats', options, true);
}

export function createTask(payload: CreateTaskRequest) {
  return apiRequest<Task>(
    '/tasks',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function getTask(taskId: string, options?: ApiRequestOptions) {
  return apiRequest<Task>(
    `/tasks/${encodeApiPathSegment(taskId)}`,
    options,
    true,
  );
}

export function getTaskProgress(taskId: string, options?: ApiRequestOptions) {
  return apiRequest<TaskSummary>(
    `/tasks/${encodeApiPathSegment(taskId)}/progress`,
    options,
    true,
  );
}

export function stopTask(taskId: string) {
  return apiRequest(`/tasks/${encodeApiPathSegment(taskId)}/stop`, {
    method: 'POST',
  });
}

export function getEmailNotificationSettings() {
  return apiRequest<EmailNotificationSettings>(
    '/notifications/email',
    undefined,
    true,
  );
}

export function requestEmailVerification(
  payload: RequestEmailVerificationRequest,
) {
  return apiRequest<EmailNotificationSettings>(
    '/notifications/email/verification',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function confirmEmailVerification(
  payload: ConfirmEmailVerificationRequest,
) {
  return apiRequest<EmailNotificationSettings>(
    '/notifications/email/verification/confirm',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function updateEmailNotification(
  payload: UpdateEmailNotificationRequest,
) {
  return apiRequest<EmailNotificationSettings>(
    '/notifications/email',
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function getDeadlineEmailNotificationSettings() {
  return apiRequest<EmailNotificationSettings>(
    '/notifications/email/deadline',
    undefined,
    true,
  );
}

export function updateDeadlineEmailNotification(
  payload: UpdateDeadlineEmailNotificationRequest,
) {
  return apiRequest<EmailNotificationSettings>(
    '/notifications/email/deadline',
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    true,
  );
}
