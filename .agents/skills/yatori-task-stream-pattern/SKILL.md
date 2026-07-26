---
name: yatori-task-stream-pattern
description: Standardize Yatori task progress polling, terminal snapshots, unauthorized exit handling, and stale-progress protection. Use when building or refactoring task progress views or background status refresh.
---

# Yatori Task Progress Pattern

Use this skill for any real-time task status UI in this repository.

The polling baseline lives in `src/hooks/useTaskProgressPolling.ts`; `src/components/Dashboard.tsx` owns it and `src/components/TaskInlineItem.tsx` renders its snapshots. The frontend polls `GET /tasks/{taskId}`; there is no SSE client contract in this repository. Extend this path instead of creating a parallel polling or stream implementation.

## Read first

1. Read the target component.
2. Read `src/hooks/useTaskProgressPolling.ts` and `src/lib/taskStatus.ts`.
3. Read `src/components/TaskInlineItem.tsx`.
4. Read `references/task-stream-contract.md`.

## Required behavior

- Poll active tasks at the existing interval.
- Fetch one snapshot for terminal states that still need details.
- Exit on 401 or 403 through the existing unauthorized flow.
- Ignore stale progress payloads when `updatedAt` goes backwards.

## Preferred structure

- Keep endpoint helpers in `src/lib/api.ts`.
- Reuse `useTaskProgressPolling`; do not duplicate its request ordering, stale-data protection, terminal snapshot, or cleanup logic in a consuming component.
- Keep task rendering state in the consuming component and endpoint helpers in `src/lib/api.ts`.
- Use `useEffectEvent` to separate non-reactive handlers from effect wiring when the codebase is already on React 19.

## Do not change casually

- polling interval
- terminal status list
- retry and cleanup timings

If you change them, say why.

## Output

Report:

- whether the work reused the existing task polling contract
- whether the existing shared hook was extended
- which terminal snapshot, stale-data, unauthorized, and cleanup rules were preserved
