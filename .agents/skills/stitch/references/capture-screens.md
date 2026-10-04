# Capture screens

Extract self-contained HTML snapshots and verification screenshots from a running web application or local HTML build.

## 1. Discover routes and running server

Check `stitch status --flow=design --json` for an auto-detected dev server in `data.facets.capture.devServerUrl`, then scan the codebase for routes with `stitch capture routes --json`. If the app switches views through in-memory state or tabs without changing the URL, inspect router and navigation components in `src/` directly. Confirm target views with the user before running bulk captures, and stop any temporary dev server you started once capture finishes.

## 2. Capture a view

All capture modes normalize output to the `1280x800` desktop viewport, inline local assets, enforce a 4 MB size cap, and write local files only. After verifying a snapshot, upload it following [upload.md](upload.md).

- **Client-rendered or authenticated page**: Run `stitch capture browser --url http://localhost:5173/dashboard -o .stitch/dashboard.html --json` to launch headless Chrome, wait for hydration, serialize runtime CSSOM and `<canvas>` elements, and write `.stitch/verify-capture.png` alongside `-o`. For slow hydration or lazy components, pass `--wait-for "<selector>"` and increase `--settle-timeout <ms>` (see `stitch capture browser --help` for all readiness and probe flags).
- **Server-rendered or static dev server route**: Run `stitch capture port --port 5173 --route /dashboard -o .stitch/dashboard.html --json` to fetch HTML over HTTP and inline local assets without running client JavaScript.
- **Prebuilt HTML file**: Run `stitch capture file ./dist/index.html -o .stitch/index.html --json` to normalize built HTML from `dist/`, `build/`, or `out/`.

## 3. Verify `.stitch/verify-capture.png` and handle auth gates

Inspect `.stitch/verify-capture.png` after each browser capture (or run `chrome-devtools take_snapshot 1`) to confirm real content rendered rather than a login prompt, modal, error boundary, or loading skeleton. If `data.warnings` reports an empty SPA shell or partial hydration, re-run with `--wait-for "<selector>"` and a larger `--settle-timeout`.

Do not edit application files in `src/` to bypass authentication or write capture scripts into the repository. Use one of these approaches with `stitch capture browser`:

- **Drive the live tab with `chrome-devtools` and `--page`**: `stitch capture browser` starts or reuses the `chrome-devtools` daemon. Sign in, dismiss modals, or click in-memory SPA tabs in the open tab, then capture `--page 1` to snapshot the live DOM without reloading:
  ```bash
  chrome-devtools take_snapshot 1
  chrome-devtools fill 1 <uid> "<value>"
  chrome-devtools click 1 <uid>
  stitch capture browser --page 1 -o .stitch/dashboard.html --json
  ```
- **Preload cookies and `localStorage` with `--storage`**: Run `stitch capture browser --url http://localhost:4321/schedule --storage .stitch/storage.json -o .stitch/schedule.html --json` to inject a Playwright-compatible `storageState` JSON file (`cookies` and `origins`) before page scripts run.
- **Run an in-page sign-in script with `--prepare`**: Run `stitch capture browser --url http://localhost:4321/login --prepare .stitch/signin.js --wait-for "#dashboard" -o .stitch/dashboard.html --json` to evaluate a JavaScript file in the page before capture (call `window.__stitchWaitFor` inside the script to await a post-login selector).
