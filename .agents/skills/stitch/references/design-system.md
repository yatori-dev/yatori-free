# Manage design systems

List, inspect, create, update, and apply Stitch design systems, or upload `DESIGN.md` to set project tokens.

## Design systems and `DESIGN.md`

Set up a project's design system in one of two ways:

1. **From `DESIGN.md`**: Extract or author `DESIGN.md` following [design-md.md](design-md.md), then check `stitch status --flow=design --json` and upload it following [../flows/design.md](../flows/design.md) with `stitch upload design DESIGN.md`. Pass `--project <project-id>` when the project is not configured locally, and `--dry-run` to preview without network calls. Once uploaded, project-level tokens apply automatically during screen generation.
2. **From theme tokens**: Create or update a `design-system` resource directly with `stitch create design-system` or `stitch edit design-system <design-system-id>`.

Confirm the display name, key colors, fonts, and corner roundness with the user before uploading `DESIGN.md` or creating or updating a design system.

## 1. List and inspect design systems

List and fetch design systems with `stitch find design-systems --project <project-id> --json` and `stitch get design-system <design-system-id> --project <project-id> --json`. Both are project-scoped, so omit `--project` only when `.stitch.json` binds a project. To derive tokens from existing project screens, inspect `screenshot.downloadUrl` and `htmlCode.downloadUrl` via `stitch find screens --project <project-id> --json` and `stitch get screen <screen-id> --project <project-id> --json`.

## 2. Inspect the schema and map tokens

Check the live JSON Schema before constructing a create or update payload with `stitch create design-system --schema` and `stitch edit design-system --schema`. The payload wraps configuration under `designSystem` with two required fields:

- `designSystem.displayName`: string name for the design system.
- `designSystem.theme`: theme object requiring `colorMode`, `headlineFont`, `bodyFont`, `roundness`, and `customColor`, plus optional `labelFont`, `colorVariant`, color overrides, `designMd`, `spacing`, and `typography`.

Map descriptive style phrases to hex codes, font enums, and roundness tokens using [design-mappings.md](design-mappings.md).

## 3. Create a design system

Run `stitch create design-system --json '{"designSystem":{"displayName":"Brand Guidelines 2026","theme":{"colorMode":"LIGHT","headlineFont":"INTER","bodyFont":"INTER","roundness":"ROUND_EIGHT","customColor":"#3366FF"}}}'`. Pass `--dryRun` to validate the payload first, and `--project <project-id>` to target a specific project.

## 4. Update a design system

Run `stitch edit design-system <design-system-id> --json '{"designSystem":{"displayName":"Brand Guidelines 2026","theme":{"colorMode":"DARK","headlineFont":"SPACE_GROTESK","bodyFont":"INTER","labelFont":"JETBRAINS_MONO","roundness":"ROUND_EIGHT","customColor":"#0EA5E9","colorVariant":"FIDELITY","overridePrimaryColor":"#0EA5E9","overrideSecondaryColor":"#1B6B93","overrideTertiaryColor":"#F2A541","overrideNeutralColor":"#0D0D0D"}}}'`. Pass `--dryRun` to preview the update. `stitch edit design-system <design-system-id>` may return `status: "pending"` while Stitch applies changes asynchronously; poll `stitch get design-system <design-system-id> --project <project-id> --json` to check completion.

## 5. Apply a design system to a screen

Run `stitch edit screen <screen-id> --design-system <design-system-id> --json`. Pass `--project <project-id>` to target a specific project, or `--dryRun` to preview before applying.
