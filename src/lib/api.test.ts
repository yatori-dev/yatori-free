import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, getCourses, getTaskConfigSnapshot, getTaskCourseIdentifiers, getUserFacingErrorMessage } from './api';

afterEach(() => vi.unstubAllGlobals());

describe('api boundary', () => {
  it('sends JSON requests with the session cookie', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"code":200,"data":{"ok":true}}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ account: 'a', password: 'p' }),
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    }));
  });

  it('rejects malformed, failed, and missing-data responses with useful errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"code":400,"message":"坏请求"}', { status: 400 })));
    await expect(apiRequest('/x')).rejects.toMatchObject({ status: 400, message: '坏请求' });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"code":200}', { status: 200 })));
    await expect(apiRequest('/x', undefined, true)).rejects.toMatchObject({ status: 200, message: '接口响应缺少 data (200)' });
    expect(getUserFacingErrorMessage({ status: 401 })).toBe('登录信息已过期，请重新登录');
  });

  it('reads course summaries using the documented response shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 200,
      data: {
        courses: [{
          course: { key: 'class-1', courseName: '课程一' },
          processing: true,
          processingTaskId: '',
        }],
        sourceStatus: { joined: 'ok' },
        errors: [],
      },
    }), { status: 200 })));

    const response = await getCourses('account-1');

    expect(response.data.courses).toEqual([{
      key: 'class-1',
      courseName: '课程一',
      processing: true,
      processingTaskId: '',
    }]);
  });

  it('rejects malformed course entries instead of treating them as an empty list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 200,
      data: { courses: [null], sourceStatus: { joined: 'ok' }, errors: [] },
    }), { status: 200 })));

    await expect(getCourses('account-1')).rejects.toThrow('课程接口响应结构异常');
  });

  it('reads course identifiers from included courses or task targets', () => {
    expect(getTaskCourseIdentifiers({
      coursesCustom: { includeCourses: ['class-2'] },
      targets: [{ classId: 'class-1', itemIds: ['point-1'] }],
    })).toEqual(['class-2']);

    expect(getTaskCourseIdentifiers({
      kind: 'task_points',
      targets: [{ classId: 'class-1', itemIds: ['point-1'] }],
    })).toEqual(['class-1']);
  });

  it('keeps course scope when an optional task snapshot field is incompatible', () => {
    const snapshot = getTaskConfigSnapshot({
      kind: 'task_points',
      coursesCustom: { includeCourses: ['class-2'] },
      targets: [{ classId: 'class-2', itemIds: ['point-1'] }],
      bypassDailyStudyLimit: 'false',
    } as never);

    expect(getTaskCourseIdentifiers(snapshot)).toEqual(['class-2']);
  });
});
