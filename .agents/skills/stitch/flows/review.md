# Flow Playbook: Local Design Review

Audit a running local application against its `DESIGN.md` design system without making network calls.

## 1. Probe local state

Run `stitch status --flow=design --json` first and inspect `data.facets` (a local review does not require a linked Canvas project, so read these facets rather than `data.state`):
- `data.facets.capture.hasSnapshot`: whether `.stitch/captured-dom.html` exists. If `false`, capture a snapshot first.
- `data.facets.design.hasDesignMd`: whether `DESIGN.md` exists. If `false`, author it with [design.md](design.md).
- `data.facets.capture.devServerUrl`: auto-detected local dev server URL to use for capture when present.

## 2. Capture the page to review

Pick the route with the user, then capture the hydrated DOM and a `1280x800` verification screenshot (`.stitch/verify-capture.png`) with `stitch capture browser --url="<devServerUrl>/<route>" -o .stitch/captured-dom.html --json`.

Inspect `.stitch/verify-capture.png` before reviewing. If a login gate, profile selector, or modal blocks the view, drive the open tab with `chrome-devtools` (`take_snapshot`, `click`, `fill`) and re-capture without reloading via `stitch capture browser --page 1 -o .stitch/captured-dom.html --json`. Do not edit application source to bypass a login gate.

## 3. Review against `DESIGN.md`

1. Read `DESIGN.md` (typography, spacing, color palette, components) and compare it against `.stitch/captured-dom.html` and `.stitch/verify-capture.png`.
2. Present findings by severity, each grounded in a selector, token, or screenshot region and paired with a concrete fix.
3. Pause for the user to choose what to act on. Do not upload or generate anything during a review; to place the captured page on Canvas afterward, run `stitch upload screen .stitch/captured-dom.html`.
