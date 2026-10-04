---
name: stitch
description: >-
  Use when the user invokes /stitch, turns an existing app or codebase into
  Stitch designs, captures or uploads screens, generates screens or variants,
  edits screens, extracts or uploads DESIGN.md, manages design systems, reviews
  a running app against DESIGN.md, or runs stitch CLI commands.
---

# Stitch

Route the user's request to the matching workflow or reference below, and run the `stitch` CLI directly for every action. Run `stitch status --flow=design --json` first when repository, dev server, or project state matters.

## Route by intent

- Turn an existing app or codebase into a Stitch project with captured screens and `DESIGN.md`: [references/code-to-design.md](references/code-to-design.md)
- Discover routes or capture HTML snapshots from a dev server, browser, or built file: [references/capture-screens.md](references/capture-screens.md)
- Upload captured HTML, images, or `DESIGN.md` to a Stitch project: [references/upload.md](references/upload.md)
- Extract a `DESIGN.md` specification from existing frontend code: [references/design-md.md](references/design-md.md)
- Author, validate, or sync `DESIGN.md` with the design flow state machine: [flows/design.md](flows/design.md)
- List, inspect, create, update, or apply Stitch design systems: [references/design-system.md](references/design-system.md)
- Generate new screens, explore variants, or edit existing screens on Stitch Canvas: [references/generate-screens.md](references/generate-screens.md)
- Enhance a rough UI prompt with design vocabulary and style terms: [references/prompt-keywords.md](references/prompt-keywords.md)
- Map product types, component patterns, and layouts before generating screens: [references/design-mappings.md](references/design-mappings.md)
- Review a running local app against `DESIGN.md` using a captured snapshot: [flows/review.md](flows/review.md)
- Run a specific command or inspect flags and input schemas: `stitch --help`, `stitch <command> --help`, `stitch <command> <resource> --schema`

## Operational rules

- **Check flow state first**: `stitch status --flow=design --json` evaluates the design state machine (`data.state`, `data.nextAction`, `data.facets.capture.devServerUrl`, `data.facets.design`). Bare `stitch status --json` checks sign-in and `canvas.present` only and returns no flow state.
- **Capture rather than generate when importing code**: When turning an existing app into Stitch designs, capture real views with `stitch capture` and upload them with `stitch upload screen`. Never call `stitch generate screen` during code import.
- **Keep the repository clean during capture**: Never edit files in `src/` to bypass login screens or write capture scripts into the repo. `stitch capture browser --url="http://localhost:PORT/ROUTE" -o .stitch/captured-dom.html --json` also writes `.stitch/verify-capture.png` and never uploads automatically. If an auth gate or modal blocks the view, drive the live tab with `chrome-devtools` (`take_snapshot`, `click`, `fill`, `navigate`) and re-run `stitch capture browser --page 1 -o .stitch/captured-dom.html --json` to capture without reloading.
- **Pause before binding or batch uploads**: Confirm with the user before binding a project (`stitch config set project <project-id>`) or uploading a batch of screens.
- **Resolve URLs via the CLI**: Print links with `stitch url project <project-id>` or `stitch url screen <screen-id> --project <project-id>` rather than constructing Canvas URLs by hand.
