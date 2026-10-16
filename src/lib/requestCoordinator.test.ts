import { describe, expect, it } from 'vitest';
import { RequestCoordinator } from './requestCoordinator';

describe('RequestCoordinator', () => {
  it('cancels the previous request for the same key and replaces it', () => {
    const coordinator = new RequestCoordinator();
    const first = coordinator.begin('courses');
    const second = coordinator.begin('courses');

    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(false);
    expect(second.requestId).toBeGreaterThan(first.requestId);
    expect(coordinator.isCurrent('courses', first.requestId)).toBe(false);
    expect(coordinator.isCurrent('courses', second.requestId)).toBe(true);
  });

  it('does not reuse ownership after cancellation or completion', () => {
    const coordinator = new RequestCoordinator();
    const first = coordinator.begin('courses');
    coordinator.cancel('courses');
    const second = coordinator.begin('courses');

    expect(coordinator.finish('courses', first.requestId)).toBe(false);
    expect(coordinator.isCurrent('courses', second.requestId)).toBe(true);
    expect(second.signal.aborted).toBe(false);
    expect(coordinator.finish('courses', second.requestId)).toBe(true);
    expect(coordinator.isCurrent('courses', second.requestId)).toBe(false);

    const third = coordinator.begin('courses');
    expect(third.requestId).toBeGreaterThan(second.requestId);
    expect(coordinator.finish('courses', second.requestId)).toBe(false);
    expect(coordinator.isCurrent('courses', third.requestId)).toBe(true);
  });

  it('cancels all active requests and clears current ownership', () => {
    const coordinator = new RequestCoordinator();
    const courses = coordinator.begin('courses');
    const tasks = coordinator.begin('tasks');

    coordinator.cancelAll();

    expect(courses.signal.aborted).toBe(true);
    expect(tasks.signal.aborted).toBe(true);
    expect(coordinator.isCurrent('courses', courses.requestId)).toBe(false);
    expect(coordinator.isCurrent('tasks', tasks.requestId)).toBe(false);

    const restarted = coordinator.begin('courses');
    expect(coordinator.isCurrent('courses', courses.requestId)).toBe(false);
    expect(restarted.requestId).toBeGreaterThan(courses.requestId);
  });
});
