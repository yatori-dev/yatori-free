import { describe, expect, it } from 'vitest';
import { isStoppedTaskNotFound } from './taskStatus';

describe('isStoppedTaskNotFound', () => {
  const missingTask = { status: 404, payload: { code: 404, message: '任务不存在' } };

  it('recognizes a missing task only when its stop is known', () => {
    expect(isStoppedTaskNotFound(missingTask, true)).toBe(true);
    expect(isStoppedTaskNotFound(missingTask, false)).toBe(false);
  });

  it('retains unrelated failures even after a stop', () => {
    expect(isStoppedTaskNotFound({ status: 404, payload: { code: 404, message: '接口不存在' } }, true)).toBe(false);
    expect(isStoppedTaskNotFound({ status: 503 }, true)).toBe(false);
  });
});
