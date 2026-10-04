# Design System: Alpine Peak

Example `DESIGN.md` specification showing token definitions and editorial design system documentation for [../design-md.md](../design-md.md) and [../../flows/design.md](../../flows/design.md).

## 1. Visual Theme & Atmosphere

High-performance, crisp alpine telemetry built for outdoor legibility in bright sunlight and low-visibility snow. Frosted glassmorphic surfaces sit over mountain terrain imagery with high-contrast data readouts.

## 2. Color Palette & Roles

### Primary Foundation
- **Deep Peak Blue (`#131b2e`)**: Dark navy container surface contrasting with white text and map overlays.
- **Powder White (`#fcf8fa`)**: Airy primary canvas background.
- **Ice Surface (`#f0edef` to `#e4e2e4`)**: Layered container tones for cards, drawers, and metric panels.

### Accent & Interactive
- **Safety Orange (`#ea580c`)**: Primary calls to action, hazard warnings, and emergency trail closures.
- **Electric Blue (`#2563eb`)**: Weather updates, active filters, and interactive controls.

### Typography & Text Hierarchy
- **Obsidian Ink (`#1b1b1d`)**: Primary text on light surfaces.
- **Slate Variant (`#45464d`)**: Secondary labels and supporting metadata.
- **Muted Outline (`#76777d`)**: Captions, timestamps, and `1px` structural hairlines.

### Functional States
- **Trail Difficulty & Status**: High-saturation Green (Easy), Blue (Intermediate), and Black (`#000000`, Expert), plus **Alert Red (`#ba1a1a`)** on `#ffdad6` containers for closures.

## 3. Typography Rules

- **Inter**: Headings and body copy (`800` display at `48px/56px`, `-0.02em` tracking; `700` headlines at `24px/32px`; `400` and `600` body at `16px/24px`).
- **Lexend**: Numeric telemetry, elevation readouts (`600` at `32px/40px`), and uppercase labels (`700` at `12px/16px`, `0.05em` tracking).

## 4. Component Stylings

- **Buttons**: Solid Safety Orange or Deep Peak Blue fill with `#ffffff` text for primary actions; `1px` `#76777d` outline for secondary actions; `52px` minimum height and `1rem` (`rounded-lg`) radius for gloved use.
- **Cards & Modals**: `70%` opacity `#ffffff` surface with `20px` backdrop blur, `1px` white border at `40%` opacity, and `1rem` radius over map layers.
- **Trail Status Chips**: Pill badges (`9999px` radius) pairing icons with explicit text labels (`Easy`, `Intermediate`, `Expert`, `Extreme`).
- **Inputs & Forms**: `#f0edef` background with a thick bottom border that turns Electric Blue on focus and fixed labels above the field.

## 5. Layout Principles

- **Grid & Spacing**: Fluid grid on a `4px` / `8px` baseline with `20px` mobile margins, `40px` desktop margins, `16px` gutters, and `24px` to `32px` card padding.
- **Responsive Behavior**: Minimum `48x48px` touch targets; multi-column desktop panels collapse into a single mobile stack with a floating bottom action bar (`90%` opacity, `4px` ambient shadow).

## 6. Design System Notes for Stitch Generation

- **Atmosphere keywords**: Frosted glassmorphism, high-contrast alpine telemetry, Powder White canvas, Deep Peak Blue panels.
- **Component prompts**: `52px` tall `1rem` rounded buttons, translucent white cards with `20px` backdrop blur over map canvases, and bold Lexend numeric readouts paired with Inter headings.
