import { describe, expect, it } from 'vitest';
import { getTaskDistribution, getTaskGroup } from './taskDashboard';

describe('task dashboard groups', () => {
  it('includes stopped tasks in the ended group and distribution', () => {
    expect(getTaskGroup('stopped')).toBe('stopped');
    expect(
      getTaskDistribution([
        { status: 'running' } as never,
        { status: 'success' } as never,
        { status: 'failed' } as never,
        { status: 'stopped' } as never,
      ]),
    ).toEqual([
      { key: 'active', label: '进行中', color: 'var(--info)', count: 1, fill: 'var(--info)' },
      { key: 'success', label: '已完成', color: 'var(--success)', count: 1, fill: 'var(--success)' },
      { key: 'attention', label: '需关注', color: 'var(--danger)', count: 1, fill: 'var(--danger)' },
      { key: 'stopped', label: '已结束', color: 'var(--muted-foreground)', count: 1, fill: 'var(--muted-foreground)' },
    ]);
  });
});
