# Angular extraction patterns

Extract design tokens, Material themes, and component styling patterns from Angular repositories (`@angular/core` in `package.json` or `angular.json` at the root).

## File discovery order

1. **`angular.json`**: Global style entry points under `projects.*.architect.build.options.styles`.
2. **`src/styles.scss` or `src/styles.css`**: Global CSS custom properties, font imports, and base element styles.
3. **`src/theme.scss` or `src/theme/`**: Custom Angular Material palettes (`mat.define-theme` in Material 3 or `mat.m2-define-light-theme` / `mat.m2-define-dark-theme` in Material 2) and SCSS token files (`_variables.scss`).
4. **Tailwind config**: `tailwind.config.js` in Tailwind v3, or `@theme {}`, `@custom-variant`, and `@plugin 'tailwindcss-primeui'` in global CSS for Tailwind v4.
5. **`src/app/app.component.scss` and `src/app/**/*.component.{scss,css,html}`**: Root layout, `:host` and `::ng-deep` encapsulation rules, and utility or `[ngClass]` bindings in standalone component templates.

## Component library and theme locations

- **Angular Material**: Extract primary, accent, and warn palettes, typography level configs, and `--mat-*` CSS custom properties.
- **PrimeNG (v17+)**: Check `src/app.config.ts` for `providePrimeNG` theme presets (`Aura`, `darkModeSelector`), `@plugin 'tailwindcss-primeui'`, and `--primary-color` / `--surface-*` custom properties.
- **Nebular**: Check `nb-theme()` registrations in `styles.scss`.
- **NG-ZORRO**: Check `ng-zorro-antd.less` variable overrides in `angular.json` or global styles.
- **Responsive breakpoints**: Check `@media` queries, Angular CDK `BreakpointObserver`, Tailwind screen prefixes, and `fxLayout` / `fxFlex` directives.
