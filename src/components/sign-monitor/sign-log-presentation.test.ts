import { describe, expect, it } from 'vitest';
import type { SignLog } from '@/lib/api';
import {
  compareSignLogsNewestFirst,
  getSignDisplayName,
  getSignResult,
} from './sign-log-presentation';

describe('sign log presentation', () => {
  it('sorts the newest sign log first', () => {
    const logs = [
      { id: 'older', createdAt: '2026-09-10T08:00:00Z' },
      { id: 'newer', createdAt: '2026-09-11T08:00:00Z' },
    ] satisfies SignLog[];

    expect(logs.sort(compareSignLogsNewestFirst).map((log) => log.id)).toEqual(['newer', 'older']);
  });

  it('does not present an activity name as the sign type', () => {
    const log = { id: 'sign-1', createdAt: '2026-09-11T08:00:00Z', signName: '10月10日' } satisfies SignLog;

    expect(getSignDisplayName(log)).toBe('普通签到');
  });

  it('presents personal status 0 as unsigned', () => {
    const log = { id: 'sign-1', createdAt: '2026-09-11T08:00:00Z', personalStatus: 0 } satisfies SignLog;

    expect(getSignResult(log)).toBe('未签到');
  });
});
