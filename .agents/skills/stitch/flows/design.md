# Flow Playbook: Design System Authoring & Cloud Sync (`design`)

Author, validate, and synchronize `DESIGN.md` with a Stitch Canvas project.

## 1. Evaluate design flow state

Run `stitch status --flow=design --json` to inspect:
- `data.state`: `NEEDS_MANIFEST` | `NEEDS_DESIGN_MD` | `READY`
- `data.facets.design`: `{ status, hasDesignMd, hasManifest }`
- `data.step` / `data.totalSteps` (`totalSteps` is 2)
- `data.designMd`: `{ valid, path }`, always present; `{ valid: false, path: "" }` when no local `DESIGN.md` exists

Act on `data.state`:
- `NEEDS_MANIFEST`: No Stitch project is linked to this repository. Run `stitch config set project <project-id>` to record the project as the repository default in `.stitch.json`.
- `NEEDS_DESIGN_MD`: Project is linked, but `DESIGN.md` does not exist locally. Author `DESIGN.md` following Step 2.
- `READY`: Project is linked and `DESIGN.md` is present. Upload and synchronize with `stitch upload design DESIGN.md`.

## 2. Author `DESIGN.md`

`DESIGN.md` is the single source of truth for the visual rhythm, typographic hierarchy, materiality, and spatial layout of your application, and grounds future screen generations (`stitch generate screen`):
1. **Materiality & Physical Metaphor**: Core mechanical heritage and user mental model (avoiding generic SaaS dashboards, ungrounded cards, floating pills, and gratuitous badge dots).
2. **Color Palette & Material Tokens**: Surface backgrounds (deep neutrals, paper, or industrial metal), border tones with structural purpose, high-contrast primary accents, and semantic alert/status tones.
3. **Typographic Hierarchy & Budget**: Primary typeface family (clean grotesk or system font stack), monospaced numeric readout font for tabular or financial data, and a strict scale (Display, Heading, Subheading, Body, Footnote).
4. **Spatial Layout & Grid Architecture**: `1280px` desktop canvas viewport standard, `4px` / `8px` spatial grid, axis-locked subgrids, and explicit padding/gap budgets.

Save the authored design system to `.stitch/DESIGN.md` or `./DESIGN.md`.

## 3. Synchronize to Stitch Canvas

Run `stitch upload design DESIGN.md` to upload and bind the specification to the linked project. `stitch upload design` resolves the target project ID from `.stitch/manifest.json`, uploads `DESIGN.md`, and creates or updates the project design system on Stitch Canvas. Re-run `stitch status --flow=design --json` to confirm `data.state` is `READY`.
