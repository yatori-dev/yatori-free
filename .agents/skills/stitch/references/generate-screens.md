# Generate screens

Generate new screens from text or uploaded mockups, explore screen variants, and edit existing screens on the Stitch Canvas.

## Choose the right command

- `stitch generate screen`: create a new screen from a structured layout and content prompt.
- `stitch generate variants`: explore 1 to 5 variations of an existing screen across layout, color scheme, imagery, font, or copy.
- `stitch edit screen <screen-id>`: apply targeted changes, switch device types, or attach a design system to an existing screen. Prefer editing over regenerating when the core layout already works.
- To onboard an existing codebase, capture and upload the running application screens instead of generating screens from text prompts.

## 1. Select or create a project

Check repository and design flow state first with `stitch status --flow=design --json`, list projects with `stitch find projects --json`, and bind one with `stitch config set project <project-id>`. Pass `--project <project-id>` per command if you do not bind a project globally, or pass `--newProject "<title>"` on `stitch generate screen` to create a project and generate its first screen in one call.

## 2. Check design system context

Check whether the project already has a design system or `DESIGN.md` with `stitch find design-systems --project <project-id> --json`. When a design system is bound to the project, omit hex codes, font names, color palettes, and corner radius tokens from `stitch generate screen` prompts so the project tokens govern styling. If the project needs a `DESIGN.md` first, follow [../flows/design.md](../flows/design.md).

## 3. Refine the prompt

Rewrite vague user phrasing into specific layout, component, and content instructions before running generation or edit commands:

1. Replace generic phrases using [design-mappings.md](design-mappings.md) and exact UI terms from [prompt-keywords.md](prompt-keywords.md).
2. For a new screen, organize the prompt into overall purpose, target platform, and numbered page sections (header, hero section, primary content area, footer) without visual theme tokens. See [examples/enhanced-prompt.md](examples/enhanced-prompt.md).
3. For an edit, name the target section and component, the visual change, and any structural addition. Hex color codes are fine in edit prompts when adjusting a specific element.

## 4. Generate a new screen

Run `stitch generate screen --project <project-id> --prompt "<prompt>" --device DESKTOP --title "<title>" --json` with `--device` (`DESKTOP`, `MOBILE`, `TABLET`, or `AGNOSTIC`) and optional `--title "<title>"`, `--newProject "<title>"`, `--model` (`GEMINI_3_8_FLASH` or `GEMINI_3_5_FLASH_LITE`), or `--dryRun`. Apply a design system to a generated screen with `stitch edit screen <screen-id> --project <project-id> --design-system <design-system-id>`.

## 5. Generate from an image or mockup

To turn a wireframe, screenshot, or mockup image into a Stitch screen, upload the image first with `stitch upload screen ./mockup.png --project <project-id> --title "Mockup" --json` and refine it with `stitch edit screen <screen-id> --project <project-id> --prompt "Recreate this dashboard mockup with a collapsible side navigation, metric summary cards, and a filterable data table" --json`.

## 6. Edit an existing screen

Pass `<screen-id>` (or comma-separated `<id1>,<id2>`) to `stitch edit screen <screen-id>` for focused adjustments, device switches (`--device`), or design system binding (`--design-system`), for example `stitch edit screen <screen-id> --project <project-id> --prompt "Change the primary call-to-action button in the hero section to #004080 and add a secondary Learn More button beside it" --json`.

## 7. Generate variants of a screen

Run `stitch generate variants --project <project-id> --screen <screen-id> --prompt "Explore compact card grids and high-contrast header layouts" --count 3 --creativeRange EXPLORE --aspects LAYOUT,COLOR_SCHEME --json` with:

- `--count`: `1` to `5` (default `3`).
- `--creativeRange`: `REFINE` (subtle polish), `EXPLORE` (balanced alternatives), or `REIMAGINE` (fresh layout).
- `--aspects`: comma-separated subset of `LAYOUT`, `COLOR_SCHEME`, `IMAGES`, `TEXT_FONT`, `TEXT_CONTENT` (omit to vary all).

## 8. Inspect and open screens

List screens with `stitch find screens --project <project-id> --json`, fetch screen metadata (`screenshot.downloadUrl` and `htmlCode.downloadUrl`) with `stitch get screen <screen-id> --project <project-id> --json`, or print and open Stitch Canvas URLs with `stitch url screen <screen-id> --project <project-id>`, `stitch url project <project-id>`, and `stitch open project <project-id>`.
