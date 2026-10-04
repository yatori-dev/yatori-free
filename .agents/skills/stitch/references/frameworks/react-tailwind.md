# React, Next.js, and Tailwind extraction patterns

Extract design tokens, theme overrides, and component styling conventions from React, Next.js, and Tailwind codebases (`react` or `next` in `package.json` or `tailwind.config.*` at the root).

## File discovery order

1. **`tailwind.config.js` or `tailwind.config.ts`**: Custom `theme.extend` scales for `colors`, `fontFamily`, `spacing`, `borderRadius`, `screens`, and `container`.
2. **`globals.css`, `global.css`, or `index.css`**: `:root` and `.dark` custom properties (`--*`), Tailwind v4 `@theme` blocks, `@layer` rules, and `@font-face` declarations.
3. **`theme.ts`, `theme.js`, or `tokens.ts`**: Design token modules passed to Tailwind or CSS-in-JS `ThemeProvider` (`styled-components`, `@emotion`).
4. **`src/app/layout.tsx` or `src/App.tsx`**: Root font loading (`next/font/google` or `next/font/local` CSS `variable` bindings), body surface classes, and shell layout.
5. **Representative components (`*.tsx`, `*.jsx`)**: Inspect 5 to 8 primitives (`Button`, `Card`, `Header`, `Input`, `Dialog`) and `cva` / `clsx` variant definitions.

## Component archetypes to inspect

- **Layout and shell**: `max-w-*` width budget, container padding, grid structure, and `sm:` / `md:` / `lg:` / `xl:` / `2xl:` responsive prefixes.
- **Button and CTA**: Border radius, variant fills, hover and focus states, and padding ratios.
- **Card**: Shadow, border treatment, corner radius, and internal padding.
- **Navigation and header**: Typography, active indicator, and bar height.
- **Form and input**: Border, focus ring, label placement, and control height.
- **Hero and section**: Vertical spacing rhythm, heading scale, and alignment.

## Component library overrides

Record the project's custom overrides rather than library defaults:

- **shadcn/ui**: CSS custom properties in `globals.css` and settings in `components.json`.
- **Chakra UI**: `extendTheme()` or `createSystem()` palette, font, and recipe overrides.
- **Material UI (MUI)**: `createTheme()` overrides for `palette`, `typography`, and `shape`.
- **Ant Design**: `ConfigProvider` `theme.token` overrides.
