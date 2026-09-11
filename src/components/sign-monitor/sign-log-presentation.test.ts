import { describe, expect, it } from 'vitest';
import type { SignLog } from '@/lib/api';
import { compareSignLogsNewestFirst } from './sign-log-presentation';

describe('sign log presentation', () => {
  it('sorts the newest sign log first', () => {
    const logs = [
      { id: 'older', createdAt: '2026-09-10T08:00:00Z' },
      { id: 'newer', createdAt: '2026-09-11T08:00:00Z' },
    ] satisfies SignLog[];

    expect(logs.sort(compareSignLogsNewestFirst).map((log) => log.id)).toEqual(['newer', 'older']);
  });
});
