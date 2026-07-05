---
name: yatori-api-sync
description: Download the latest Yatori official API documentation, save it locally, and reconcile it against src/lib/api.ts before any frontend API change. Use when backend endpoints changed, the official API doc changed, login/task/sign-monitor requests or fields look wrong, or a new API needs to be added to the frontend.
---

# Yatori API Sync

Use this skill before editing frontend API contracts.

This repository has a hard rule: read the latest official API doc first, then compare it with `src/lib/api.ts` field by field. Treat the official doc as source of truth for paths, request bodies, response bodies, and business status codes.

## Workflow

1. Read `src/lib/api.ts` and list the affected types, request helpers, and endpoints.
2. Run `scripts/fetch_api_doc.ps1` to download the latest official OpenAPI JSON to a local ignored folder.
3. Run `scripts/extract_frontend_api_paths.ps1` to extract the frontend paths already used in `src/lib/api.ts`.
4. Read `references/api-checklist.md`.
5. Compare the official doc against:
   - exported TypeScript interfaces
   - endpoint paths
   - request method
   - query and body fields
   - response payload shape
   - business `code` handling
6. Update `src/lib/api.ts` first.
7. Then update the calling components and hooks.
8. Report mismatches explicitly. Do not silently guess field names.

## Rules

- Always download the latest doc before changing frontend API code.
- The official doc is a live-updating OpenAPI JSON endpoint. Do not commit downloaded docs, generated outputs, or API snapshots.
- The fetch script reads the API doc secret from `YATORI_API_DOC_SECRET`, or from an explicit `-Secret` / `-Url` argument.
- Prefer changing `src/lib/api.ts` before touching UI components.
- If the doc and frontend disagree, trust the doc unless the user says otherwise.
- When the backend shape is unclear, call that out instead of inventing a type.

## Scope

Check these files first:

- `src/lib/api.ts`
- `src/components/Login.tsx`
- `src/components/Dashboard.tsx`
- `src/components/SignMonitor.tsx`
- `src/components/TaskInlineItem.tsx`

## Resources

- `scripts/fetch_api_doc.ps1`: Download the latest OpenAPI JSON to `.tmp/api-docs`.
- `scripts/extract_frontend_api_paths.ps1`: Extract currently referenced frontend API paths from `src/lib/api.ts`.
- `references/api-checklist.md`: Contract comparison checklist for this repository.
