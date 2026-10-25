import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  apiRequest,
  createTask,
  exchangeQRSession,
  getCourseChapterDetails,
  getCourseOutline,
  getCourses,
  getExams,
  getSMSConfig,
  getTaskConfigSnapshot,
  getTaskCourseIdentifiers,
  getTaskKind,
  getTaskProgress,
  getTasks,
  getTaskStats,
  getUserFacingErrorMessage,
  getWorks,
} from './api';

afterEach(() => vi.unstubAllGlobals());

describe('api boundary', () => {
  it('sends only the current task creation contract', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 201, data: { id: 'task-1' } }), { status: 201 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await createTask({
      accountId: 'account-1',
      kind: 'works',
      targets: [{ classId: 'class-1', itemIds: ['work-1'] }],
      coursesCustom: {
        workAutoSubmit: 1,
        workAutoSubmitBeforeDeadlineMinutes: 5,
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          accountId: 'account-1',
          kind: 'works',
          targets: [{ classId: 'class-1', itemIds: ['work-1'] }],
          coursesCustom: {
            workAutoSubmit: 1,
            workAutoSubmitBeforeDeadlineMinutes: 5,
          },
        }),
      }),
    );
  });

  it('sends JSON requests with the session cookie', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response('{"code":200,"data":{"ok":true}}', { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ account: 'a', password: 'p' }),
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      }),
    );
  });

  it('rejects malformed, failed, and missing-data responses with useful errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('{"code":400,"message":"坏请求"}', { status: 400 }),
        ),
    );
    await expect(apiRequest('/x')).rejects.toMatchObject({
      status: 400,
      message: '坏请求',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"code":200}', { status: 200 })),
    );
    await expect(apiRequest('/x', undefined, true)).rejects.toMatchObject({
      status: 200,
      message: '接口响应缺少 data (200)',
    });
    expect(getUserFacingErrorMessage({ status: 401 })).toBe(
      '登录信息已过期，请重新登录',
    );
  });

  it('reports a request timeout and aborts the underlying fetch', async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/slow', { timeoutMs: 10 })).rejects.toMatchObject({
      kind: 'timeout',
      status: 0,
      message: '请求超时 (10ms)',
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it.each([
    {
      status: 409,
      error: 'PASSWORD_LOGIN_REQUIRED',
      message: '请先使用最新的学习通账号密码登录一次，之后才能使用扫码或短信验证码登录',
    },
    {
      status: 503,
      error: 'PASSWORD_VALIDATION_UNAVAILABLE',
      message: '暂时无法校验学习通账号密码，请稍后重试',
    },
  ])('preserves QR password validation errors and allows the same session to retry: $error', async ({ status, error, message }) => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ code: status, error, message }),
        { status },
      ))
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ code: 200, data: { expiresAt: '2099-01-01T00:00:00Z' } }),
        { status: 200 },
      ));
    vi.stubGlobal('fetch', fetchMock);

    const rejected = await exchangeQRSession('same-qr-session').catch((cause: unknown) => cause);
    expect(rejected).toMatchObject({ status, payload: { error, message } });
    expect(getUserFacingErrorMessage(rejected)).toBe(message);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await expect(exchangeQRSession('same-qr-session')).resolves.toMatchObject({ code: 200 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/auth/qr-sessions/same-qr-session/session',
      '/api/auth/qr-sessions/same-qr-session/session',
    ]);
  });

  it('reads course summaries using the documented response shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 200,
            data: {
              courses: [
                {
                  course: { key: 'class-1', courseName: '课程一' },
                  processing: true,
                  processingTaskId: '',
                },
              ],
              sourceStatus: { joined: 'ok' },
              errors: [],
            },
          }),
          { status: 200 },
        ),
      ),
    );

    const response = await getCourses('account-1');

    expect(response.data.courses).toEqual([
      {
        key: 'class-1',
        courseName: '课程一',
        processing: true,
        processingTaskId: '',
      },
    ]);
  });

  it('rejects malformed course entries instead of treating them as an empty list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 200,
            data: {
              courses: [null],
              sourceStatus: { joined: 'ok' },
              errors: [],
            },
          }),
          { status: 200 },
        ),
      ),
    );

    await expect(getCourses('account-1')).rejects.toThrow(
      '课程接口响应结构异常',
    );
  });

  it('reads course identifiers from included courses or task targets', () => {
    expect(
      getTaskCourseIdentifiers({
        coursesCustom: { includeCourses: ['class-2'] },
        targets: [{ classId: 'class-1', itemIds: ['point-1'] }],
      }),
    ).toEqual(['class-2']);

    expect(
      getTaskCourseIdentifiers({
        kind: 'task_points',
        targets: [{ classId: 'class-1', itemIds: ['point-1'] }],
      }),
    ).toEqual(['class-1']);
  });

  it('uses task summaries without loading their configuration', () => {
    expect(getTaskCourseIdentifiers({ courseIdentifiers: ['class-3'] })).toEqual(['class-3']);
    expect(getTaskCourseIdentifiers({
      courseIdentifiers: [],
      configSnapshot: { targets: [{ classId: 'old-class', itemIds: [] }] },
    })).toEqual([]);
    expect(getTaskCourseIdentifiers({
      configSnapshot: { targets: [{ classId: 'class-2', itemIds: [] }] },
    })).toEqual(['class-2']);
    expect(getTaskKind({ kind: 'exams', configSnapshot: { kind: 'works' } })).toBe('exams');
    expect(getTaskKind({ configSnapshot: { kind: 'task_points' } })).toBe('task_points');
  });

  it('requests server-side task filtering and preserves pagination and summary fields', async () => {
    const data = {
      tasks: [{
        id: 'task-1', accountId: 'account-1', autoResume: false, status: 'success',
        kind: 'works', courseNames: ['课程一'], courseIdentifiers: ['class-1'],
      }],
      page: 3,
      pageSize: 10,
      total: 41,
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 200, data }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    const result = await getTasks({
      group: 'completed', status: 'success', kind: 'works', q: '课程 一',
      sort: 'oldest', page: 3, pageSize: 10,
    }, { signal: controller.signal });

    expect(result.data).toEqual(data);
    const [url, init] = fetchMock.mock.calls[0];
    const parsed = new URL(String(url), 'https://example.test');
    expect(parsed.pathname).toBe('/api/tasks');
    expect(Object.fromEntries(parsed.searchParams)).toEqual({
      group: 'completed', status: 'success', kind: 'works', q: '课程 一',
      sort: 'oldest', page: '3', pageSize: '10',
    });
    expect(init.signal.aborted).toBe(false);
  });

  it('keeps the existing task request options signature', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 200, data: { tasks: [], page: 1, pageSize: 20, total: 0 } }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await getTasks({ headers: { 'X-Request': 'existing-caller' } });

    expect(fetchMock).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({
      headers: expect.objectContaining({ 'X-Request': 'existing-caller' }),
    }));
  });

  it('delegates the attention status filter to the server', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 200, data: { tasks: [], page: 1, pageSize: 10, total: 0 } }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await getTasks({ status: 'attention', page: 1, pageSize: 10 });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks?status=attention&page=1&pageSize=10',
      expect.any(Object),
    );
  });

  it('uses separate endpoints for outlines, chapter details, task progress and statistics', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(
      new Response('{"code":200,"data":{}}', { status: 200 }),
    ));
    vi.stubGlobal('fetch', fetchMock);

    await getCourseOutline('account/1', 'class/1');
    await getCourseChapterDetails('account/1', 'class/1', 'chapter/1');
    await getTaskProgress('task/1');
    await getTaskStats();

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/accounts/account%2F1/courses/class%2F1/outline',
      '/api/accounts/account%2F1/courses/class%2F1/chapters/chapter%2F1',
      '/api/tasks/task%2F1/progress',
      '/api/tasks/stats',
    ]);
  });

  it('refreshes only the selected course resource without forwarding custom options to fetch', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify({
        code: 200,
        data: { courses: [], sourceStatus: { joined: 'ok' }, errors: [] },
      }), { status: 200 }),
    ));
    vi.stubGlobal('fetch', fetchMock);

    await getCourses('account-1', { refresh: true });
    await getCourseOutline('account-1', 'class-1', { refresh: true });
    await getCourseChapterDetails('account-1', 'class-1', 42, { refresh: true });
    await getWorks('account-1', { refresh: true });
    await getExams('account-1', { refresh: true });
    await getExams('account-1', { refresh: false });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/accounts/account-1/courses?refresh=true',
      '/api/accounts/account-1/courses/class-1/outline?refresh=true',
      '/api/accounts/account-1/courses/class-1/chapters/42?refresh=true',
      '/api/accounts/account-1/works?refresh=true',
      '/api/accounts/account-1/exams?refresh=true',
      '/api/accounts/account-1/exams',
    ]);
    for (const [, options] of fetchMock.mock.calls) {
      expect(options).not.toHaveProperty('refresh');
    }
  });

  it.each([false, true])(
    'reads nested SMS verification configuration when enabled=%s',
    async (enabled) => {
      const turnstile = {
        enabled,
        siteKey: enabled ? 'site-key' : '',
        action: 'sms_send',
      };
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ code: 200, data: { turnstile } }), {
            status: 200,
          }),
        ),
      );

      expect((await getSMSConfig()).data.turnstile).toEqual(turnstile);
    },
  );

  it.each([
    { enabled: false, siteKey: '' },
    { turnstile: { enabled: true, siteKey: '', action: 'sms_send' } },
    { turnstile: { enabled: true, siteKey: 'site-key', action: 'other' } },
  ])(
    'rejects unusable SMS configuration instead of disabling verification: %j',
    async (data) => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ code: 200, data }), { status: 200 }),
        ),
      );

      await expect(getSMSConfig()).rejects.toThrow('短信验证配置异常，请重试');
    },
  );

  it('keeps course scope when an optional task snapshot field is incompatible', () => {
    const snapshot = getTaskConfigSnapshot({
      kind: 'task_points',
      coursesCustom: { includeCourses: ['class-2'] },
      targets: [{ classId: 'class-2', itemIds: ['point-1'] }],
      executionMode: 'unknown',
    } as never);

    expect(getTaskCourseIdentifiers(snapshot)).toEqual(['class-2']);
    expect(snapshot?.executionMode).toBeUndefined();
  });

  it.each(['normal', 'aggressive'] as const)(
    'preserves the %s execution mode in task snapshots',
    (executionMode) => {
      expect(getTaskConfigSnapshot({ executionMode })).toEqual({ executionMode });
    },
  );
});
