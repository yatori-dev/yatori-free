# Plain CSS, Sass, and Less extraction patterns

Extract design tokens, preprocessor variables, and layout rules from vanilla CSS, Sass/SCSS, Less, or static HTML projects.

## File discovery order

1. **`index.html` and `*.html`**: Linked stylesheets, `<style>` blocks, and Google Fonts or local font imports.
2. **Main stylesheets (`style.css`, `main.css`, `app.css`)**: `:root` custom properties (`--*`), base element resets, and `@media` breakpoints (`max-width`, `min-width`, `prefers-color-scheme`).
3. **Preprocessor token files (`_variables.scss`, `_tokens.scss`, `variables.less`)**: Sass `$variables` and token maps (`$colors`, `$breakpoints`, `$spacers`) or Less `@variables`.
4. **`_mixins.scss`**: Shared button, card, typography, and breakpoint mixins.
5. **Component or module stylesheets**: Individual CSS files for UI primitives.

## Static sites, CMS themes, and un-tokenized CSS

- **WordPress**: Check `style.css` header metadata, `theme.json` in block themes, `wp-content/themes/<name>/assets/css/`, and `functions.php` font enqueues.
- **Jekyll or Hugo**: Check `_sass/` and `assets/css/`.
- **Un-tokenized stylesheets and inline styles**: When no `:root` or preprocessor variables exist, scan stylesheets and inline `style="..."` attributes for `background-color`, `color`, `border-color`, `border-radius`, `box-shadow`, `font-family`, `fill`, and `stroke`. Group and deduplicate hex, `rgb()`, and `hsl()` values by selector context.
