---
name: yatori-shadcn-feature-workflow
description: Add or revise Yatori frontend features with the repository's existing shadcn, Tailwind, and theme-token conventions. Use when building forms, settings panels, dialogs, list sections, filter bars, or other incremental UI features that must match the current Vite + React + TypeScript project structure.
---

# Yatori Shadcn Feature Workflow

Use this skill when adding UI without breaking the current visual system.

This project already has:

- `components.json`
- `src/index.css`
- `src/components/ui/`
- Lucide icons
- `radix-nova` style with CSS variables and Tailwind CSS 4

Stay inside that system.

## Read first

1. Read `components.json`.
2. Read `src/index.css`.
3. Read the surrounding feature component.
4. Read `references/ui-workflow.md`.

## Workflow

1. Reuse existing `src/components/ui/` primitives first.
2. If a primitive is missing, add a focused local primitive under `src/components/ui/`; `components.json` has no registry configured.
3. Keep feature components under `src/components/`.
4. Keep copy short and task-facing.
5. Do not run browser or visual regression checks, builds, or static checks from this skill in this repository; report the changed UI surface and leave CI/user visual review as the verification boundary defined by `AGENTS.md`.

## Rules

- Do not paste explanatory copy into the interface.
- Do not create floating design experiments unrelated to the current page.
- Reuse theme tokens from `src/index.css` before introducing raw colors.
- Reuse Lucide icons before drawing custom icons.
- Check both light and dark themes. Theme state uses `next-themes` and the `yatori-theme` storage key.
- Keep border radius and density aligned with current pages.
- Never use a tiled dashboard layout: do not arrange page or settings content as a uniform card matrix or mechanical equal-width columns. Prefer content-driven groups, vertical flow, dividers, and intentional whitespace. CSS Grid is allowed only for structural alignment and must not create a checkerboard visual.
- For settings, preserve vertical category navigation on desktop, a single category selector on mobile, and one content flow per category. Use headings, short descriptions, and dividers; do not turn every row into a card.
- For notification settings, keep email binding, verification, notification enablement, and deadline reminders as distinct groups. Render status from real state with text plus an icon; never use color alone.
- Theme controls must expose light, dark, and system choices using existing semantic tokens and a clear selected state. Preserve compact brand-mark behavior when space is constrained.

## Context7

For shadcn and framework questions, use Context7 first. Do not rely on stale memory for library details.

## Output

Report:

- which existing primitives were reused
- whether any new UI building blocks were added
- whether colors or spacing were aligned to existing tokens
