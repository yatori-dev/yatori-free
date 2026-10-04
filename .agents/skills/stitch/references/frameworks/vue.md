# Vue and Nuxt extraction patterns

Extract design tokens, theme plugin configs, and Single-File Component (`*.vue`) styles from Vue and Nuxt repositories (`vue` or `nuxt` in `package.json` or `nuxt.config.*` at the root).

## File discovery order

1. **`nuxt.config.ts` or `nuxt.config.js`**: Global `css` entries, font modules, and Tailwind or UnoCSS modules.
2. **`assets/css/main.css` or `src/assets/main.css`**: Global `:root` custom properties, resets, and font imports.
3. **`tailwind.config.js`**: When Tailwind is present, follow [react-tailwind.md](react-tailwind.md).
4. **`app.vue`, `layouts/default.vue`, and `composables/`**: Root layout shell, surface classes, and `useTheme` or `useColorMode` theme state.
5. **`components/**/*.vue`**: `<style scoped>` blocks, `var(--*)` token references, and BEM class structures across 5 to 8 core components.

## Component library overrides

- **Vuetify**: `createVuetify({ theme })` light and dark palette definitions in `plugins/vuetify.ts`.
- **Quasar**: `framework.config.brand` in `quasar.config.js` or `src/css/quasar.variables.scss`.
- **PrimeVue**: Theme preset configuration in `nuxt.config.ts` or `main.ts` and `--p-*` CSS custom properties.
- **Element Plus**: SCSS variable overrides in `element-variables.scss`.
