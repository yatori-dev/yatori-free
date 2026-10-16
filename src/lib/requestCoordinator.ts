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
  private requestSequence = 0;

  begin(key: string): RequestHandle {
    this.cancel(key);
    const requestId = ++this.requestSequence;
    const controller = new AbortController();
    this.active.set(key, { controller, requestId });
    return { signal: controller.signal, requestId };
  }

  isCurrent(key: string, requestId: number) {
    return this.active.get(key)?.requestId === requestId;
  }

  finish(key: string, requestId: number) {
    if (!this.isCurrent(key, requestId)) {
      return false;
    }
    this.active.delete(key);
    return true;
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
