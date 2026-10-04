# Upload screens and design systems

Upload captured HTML pages, image mockups, and `DESIGN.md` specifications to a Stitch Canvas project.

## 1. Check project binding

The CLI authenticates via `stitch login` or its configured environment key; do not read editor config files to extract credentials manually. Check sign-in and project binding first with `stitch status --flow=design --json`.

If no project is linked yet, list existing projects with `stitch find projects --limit 10 --json` and bind one with `stitch config set project <project-id>` (or pass `--project <project-id>` on each upload command). Before uploading a batch of screens, show the user the planned file paths, routes, and titles and wait for confirmation.

## 2. Upload a screen

Upload a self-contained `.html` snapshot from [capture-screens.md](capture-screens.md) or a `.png`, `.jpg`, `.jpeg`, or `.webp` image with `stitch upload screen .stitch/dashboard.html --route /dashboard --title "Dashboard" --json`.

Pass `--route` to record the uploaded screen in `.stitch/manifest.json` as the reference screen for that route. If `stitch upload screen` warns that an `.html` file still contains relative local asset paths, inline and normalize assets first with `stitch capture file ./raw/page.html -o .stitch/page.html --json`.

## 3. Upload `DESIGN.md`

Extract `DESIGN.md` from existing code via [design-md.md](design-md.md) or author and validate it via [../flows/design.md](../flows/design.md), then upload and bind it to the project with `stitch upload design DESIGN.md --json`.

## 4. Verify on Canvas

List project screens with `stitch find screens --project <project-id> --json`, or resolve and open Canvas URLs with `stitch url project <project-id>`, `stitch url screen <screen-id> --project <project-id>`, and `stitch open project <project-id>`.
