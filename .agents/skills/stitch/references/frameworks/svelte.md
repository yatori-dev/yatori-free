# Svelte and SvelteKit extraction patterns

Extract design tokens, global CSS custom properties, and scoped component styles from Svelte and SvelteKit repositories (`svelte` in `package.json` or `svelte.config.js` at the root).

## File discovery order

1. **`src/app.css` or `src/app.postcss`**: Global `:root` custom properties (`--color-*`, `--font-*`, `--radius-*`, `--spacing-*`) and base styles.
2. **`svelte.config.js` and `tailwind.config.js`**: Preprocessor, Tailwind, or UnoCSS setup. When Tailwind is configured, follow [react-tailwind.md](react-tailwind.md).
3. **`src/lib/theme.ts` or `src/lib/tokens.ts`**: Shared design tokens exported as TypeScript or JavaScript modules.
4. **`src/routes/+layout.svelte` and `+layout.ts`**: Root font imports, page background, shell structure, and dynamic theme initialization.
5. **`src/lib/components/*.svelte`**: Scoped `<style>` blocks, `var(--*)` usages, component variant props, and transition timings across core primitives.

## Component library overrides

- **Skeleton UI**: Custom Skeleton theme definitions and `--theme-*` properties in `tailwind.config.js` or global CSS.
- **DaisyUI**: `daisyui.themes` in `tailwind.config.js`.
- **Flowbite-Svelte and shadcn-svelte**: `tailwind.config.js` and custom properties in `src/app.css`.
