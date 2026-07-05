---
name: yatori-fat-component-refactor
description: Refactor oversized Yatori frontend components into smaller modules that follow this repository's structure and boundaries. Use when Dashboard, Login, SignMonitor, or similar files are too large, mix fetching with rendering, duplicate state logic, or need extraction into subcomponents, hooks, and lib helpers.
---

# Yatori Fat Component Refactor

Use this skill when a page component is turning into a mess.

Current hotspots already justify this skill:

- `src/components/Dashboard.tsx`
- `src/components/SignMonitor.tsx`
- `src/components/TaskInlineItem.tsx`

## Required pass before editing

1. Read the whole target component.
2. List:
   - local state groups
   - side effects
   - request functions
   - pure view sections
   - imported child components
3. Read `references/refactor-checklist.md`.
4. Read `references/target-layout.md`.

## Split order

Use this order unless the file is tiny.

1. Extract pure presentational blocks first.
2. Extract repeated render helpers next.
3. Extract stateful side-effect logic into hooks only when the hook has a clear owner.
4. Move shared data shaping into `src/lib/`.
5. Keep the page container in `src/components/`.

## Repository rules

- Page container stays in `src/components/`.
- Feature-specific presentational pieces go to feature folders such as:
  - `src/components/dashboard/`
  - `src/components/sign-monitor/`
- Shared UI primitives stay in `src/components/ui/`.
- Reusable non-UI helpers go to `src/lib/`.
- Do not create placeholder files.
- Do not move explanatory text into the UI.

## Stop conditions

Do not invent a hook just to reduce line count.

Create a hook only if it owns one of these:

- fetch lifecycle
- stream lifecycle
- local persistence
- derived selection logic reused across multiple components

## Output

Report:

- which submodules were created
- what responsibilities moved
- what still intentionally remains in the container
