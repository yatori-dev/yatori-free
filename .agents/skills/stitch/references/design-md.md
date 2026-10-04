# Extract DESIGN.md from source code

Extract a `DESIGN.md` design system specification from frontend source files without building or rendering the application.

## 1. Check design flow status

Run `stitch status --flow=design --json` and inspect `data.state` (`NEEDS_MANIFEST`, `NEEDS_DESIGN_MD`, or `READY`) and `data.facets.design` to see whether `.stitch/DESIGN.md` or `DESIGN.md` already exists.

## 2. Detect the framework and styling stack

Read `package.json` and root config files to identify the framework, CSS pipeline, and token libraries (`style-dictionary`, `@chakra-ui/react`, `@mui/material`, `antd`, `shadcn/ui`), then open the matching guide:

- React, Next.js, or Tailwind (`react`, `next`, `tailwind.config.*`): [frameworks/react-tailwind.md](frameworks/react-tailwind.md)
- Vue or Nuxt (`vue`, `nuxt`): [frameworks/vue.md](frameworks/vue.md)
- Svelte or SvelteKit (`svelte`): [frameworks/svelte.md](frameworks/svelte.md)
- Angular (`@angular/core`, `angular.json`): [frameworks/angular.md](frameworks/angular.md)
- Plain CSS, Sass, Less, or static HTML (`.css`, `.scss`, `.less`, `.html`): [frameworks/plain-css.md](frameworks/plain-css.md)

Read global theme files, Tailwind configs, and CSS custom properties (`--*`) before inspecting individual components in `src/components/`, `src/styles/`, or `src/theme/`.

## 3. Write DESIGN.md across six sections

Write `.stitch/DESIGN.md` or `./DESIGN.md` using [examples/DESIGN.md](examples/DESIGN.md) as the structural reference:

1. **Visual theme and atmosphere**: Root surface lightness (`#f` light vs `#0` to `#2` dark), layout density, warm vs cool neutral temperature, and visual intent from stylesheet comments.
2. **Color palette and roles**: Consolidate near-duplicate hex values into canonical tokens. Give every color a descriptive character name, hex code, and functional role across four groups: primary foundation, accent and interactive, typography hierarchy, and functional status states.
3. **Typography rules**: Font families with character descriptions, plus `font-size`, `font-weight`, `line-height`, and `letter-spacing` across display headers, `h1` through `h6`, body copy, and labels.
4. **Component stylings**: Border radius, padding ratios, fills, borders, and interactive states for core primitives (`Button`, `Card`, `Navigation`, `Input`) plus 1 to 2 domain components.
5. **Layout principles**: Max container width, column counts, base spacing unit (`4px` or `8px`), vertical rhythm, and responsive breakpoints.
6. **Stitch generation notes**: Atmosphere keywords, canonical color names with hex codes, and 2 to 3 plain-language component prompts for future screen generation.

## 4. Upload to Stitch Canvas

Follow [../flows/design.md](../flows/design.md) to bind a project if needed and synchronize `DESIGN.md` with `stitch upload design DESIGN.md`.
