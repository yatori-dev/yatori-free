import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, getCourses, getUserFacingErrorMessage, login } from './api';

afterEach(() => vi.unstubAllGlobals());

describe('api boundary', () => {
  it('adds JSON headers and credentials, then returns successful payloads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"code":200,"data":{"ok":true}}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await login({ account: 'a', password: 'p' });
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

  it('normalizes complete course details from the course list endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 200,
      data: {
        courses: [null, {
          course: { key: 'class-1', courseName: '课程一' },
          processing: true,
          works: [{ id: 'work-1', runnable: true }],
        }],
        sourceStatus: { joined: 'ok', research: 'ok' },
        errors: [],
      },
    }), { status: 200 })));

    const response = await getCourses('account-1');

    expect(response.data.courses).toEqual([{
      key: 'class-1',
      courseName: '课程一',
      processing: true,
      processingTaskId: undefined,
    }]);
    expect(response.data.courseDetails['class-1']?.works).toEqual([{ id: 'work-1', runnable: true }]);
  });
});
