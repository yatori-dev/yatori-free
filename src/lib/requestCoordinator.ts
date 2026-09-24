export interface RequestHandle {
  signal: AbortSignal;
  requestId: number;
}

interface ActiveRequest {
  controller: AbortController;
  requestId: number;
}

export class RequestCoordinator {
  private readonly active = new Map<string, ActiveRequest>();

  begin(key: string): RequestHandle {
    this.cancel(key);
    const current = this.active.get(key);
    const requestId = (current?.requestId ?? 0) + 1;
    const controller = new AbortController();
    this.active.set(key, { controller, requestId });
    return { signal: controller.signal, requestId };
  }

  isCurrent(key: string, requestId: number) {
    return this.active.get(key)?.requestId === requestId;
  }

  cancel(key: string) {
    const current = this.active.get(key);
    if (!current) {
      return;
    }
    current.controller.abort();
    this.active.delete(key);
  }

  cancelAll() {
    for (const current of this.active.values()) {
      current.controller.abort();
    }
    this.active.clear();
  }
}
