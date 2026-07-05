---
name: yatori-task-stream-pattern
description: Standardize Yatori task progress streaming with SSE, polling fallback, unauthorized exit handling, and stale-progress protection. Use when building or refactoring task progress views, background status refresh, streaming logs, or any frontend flow that mirrors the existing task progress behavior.
---

# Yatori Task Stream Pattern

Use this skill for any real-time task status UI in this repository.

The current baseline lives in `src/components/TaskInlineItem.tsx`. Reuse its semantics instead of inventing a new stream contract.

## Read first

1. Read the target component.
2. Read `src/components/TaskInlineItem.tsx`.
3. Read `references/task-stream-contract.md`.

## Required behavior

- Prefer SSE when available.
- Fall back to polling if SSE is unavailable or never opens.
- Fetch one snapshot for terminal states that still need details.
- Exit on 401 through the existing unauthorized flow.
- Ignore stale progress payloads when `updatedAt` goes backwards.

## Preferred structure

- Keep endpoint helpers in `src/lib/api.ts`.
- Keep stream state close to the consuming component unless two or more callers need the same lifecycle.
- If multiple callers need it, extract a hook such as `useTaskProgressStream`.
- Use `useEffectEvent` to separate non-reactive handlers from effect wiring when the codebase is already on React 19.

## Do not change casually

- SSE event name
- token transport for stream URL
- terminal status list
- polling backoff timings

If you change them, say why.

## Output

Report:

- whether the work reused the existing task stream contract
- whether a shared hook was extracted
- which fallback and cleanup rules were preserved
