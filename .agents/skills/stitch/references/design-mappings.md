# Design mappings and descriptors

Mappings from everyday user phrasing to specific UI component, mood, geometry, and elevation terms for Stitch prompts.

## UI and UX keyword refinement

- "menu at the top": sticky navigation bar with logo and nav links
- "big photo": full-width hero section with focal-point imagery
- "list of things": responsive card grid with hover states and subtle elevation
- "button": primary call-to-action button with clear label
- "form": clean form with labeled input fields, validation states, and submit button
- "picture area": hero section with focal-point image or video background
- "sidebar": collapsible side navigation with icon and label pairs
- "popup": modal dialog with backdrop overlay and smooth entry animation

## Atmosphere and mood descriptors

- **Modern**: clean, minimal layout with generous whitespace and high-contrast typography
- **Professional**: structured, trustworthy layout using subtle shadows and a restrained palette
- **Fun or playful**: lively, organic layout with rounded corners, bold accent colors, and bouncy micro-interactions
- **Dark mode**: high-contrast accents on deep slate or near-black surfaces
- **Luxury**: spacious layout with fine rules, serif headings, and large editorial photography
- **Tech or cyber**: sharp geometry, neon accents, translucent blurred panels, and monospaced data labels

## Geometry and shape translation

- **Pill-shaped**: `rounded-full` buttons, badges, and tags
- **Softly rounded**: `rounded-xl` or `rounded-2xl` cards and panels
- **Sharp and precise**: `rounded-none` or `rounded-sm` containers and tables
- **Glassmorphism**: semi-transparent surfaces with background blur and thin borders

## Depth and elevation

- **Flat**: no shadows, relying on surface color contrast and hairline borders
- **Whisper-soft**: diffused, low-opacity shadows for subtle lift
- **Floating**: high-offset soft shadows for menus, dialogs, and toolbars above the canvas
- **Inset**: subtle inner border or recessed fill for inputs and wells
