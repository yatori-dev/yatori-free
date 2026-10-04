# Turn code into a Stitch project

Convert an existing frontend application into a Stitch Canvas project by capturing rendered screens, extracting `DESIGN.md` from the codebase, and uploading both to Stitch.

## 1. Check local flow state

Run `stitch status --flow=design --json` and inspect `data.state` (`NEEDS_MANIFEST`, `NEEDS_DESIGN_MD`, or `READY`), `data.facets.capture.devServerUrl`, `data.facets.design.hasManifest`, and `data.facets.design.hasDesignMd`.

## 2. Link a Stitch project

If `data.facets.design.hasManifest` is `false`, list existing projects with `stitch find projects --limit 10 --json` or create a new one with `stitch create project --json '{"title":"App Design System"}'`, confirm the selection with the user, and bind it to `.stitch.json` with `stitch config set project <project-id>`.

## 3. Discover application routes

Scan the codebase for capturable routes with `stitch capture routes --json`. If discovery returns many routes, show the list to the user and confirm which core views to capture and upload before continuing.

## 4. Capture and upload each core view

Capture real rendered views from the user's app following [capture-screens.md](capture-screens.md) (for example, `stitch capture browser --url http://localhost:5173/dashboard -o .stitch/dashboard.html --json`), inspect `.stitch/verify-capture.png` before uploading each view to verify it rendered real content rather than a login gate, modal, or loading skeleton, and upload each verified snapshot following [upload.md](upload.md) with `stitch upload screen .stitch/dashboard.html --route /dashboard --title "Dashboard" --json`. Do not call `stitch generate screen` or edit `src/` to bypass authentication during this flow.

## 5. Extract and upload `DESIGN.md`

If `data.facets.design.hasDesignMd` is `false` or the user wants tokens refreshed from current styles, extract the specification from the codebase following [design-md.md](design-md.md) and write `DESIGN.md`. Upload and bind `DESIGN.md` to the linked project following [../flows/design.md](../flows/design.md) with `stitch upload design DESIGN.md --json`, then re-run `stitch status --flow=design --json` to confirm `data.state` is `READY`.

## 6. Report the Canvas URL

Print the canonical project link with `stitch url project <project-id>` or open it in the browser with `stitch open project <project-id>`.
