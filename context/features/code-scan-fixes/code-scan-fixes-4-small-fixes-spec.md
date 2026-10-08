# Small Fixes and Shared Helpers

## Overview

The smaller findings from the 2026-10-08 code scan, done together on one branch:

1. **Image preview link (Low, security):** the drawer's image preview opens the raw public R2 file, where an uploaded SVG's script would run
2. **Shared helpers:** duplicated Prisma error checks, item type defaults and API route responses
3. **Items list component:** `/items/[type]` picks its layout with a nested ternary

Only the first changes behavior (the preview stops being a link). The rest are refactors: pages, responses, status codes, headers and messages stay the same.

## 1. Image Preview Link

SVG uploads are allowed (`src/lib/file-constraints.ts`), and the drawer's image preview (`src/components/items/ItemDrawerContent.tsx`, `FileContent`) wraps the image in `<a href={imageUrl} target="_blank">` pointing at the raw public R2 URL. Opening an SVG that way runs any script inside it on the R2 domain. The download route is protected (`attachment`, `nosniff`, sandbox CSP), but the public R2 URL isn't.

It's harmless today because `R2_PUBLIC_URL` is on Cloudflare's `r2.dev` domain, separate from the app. It would become stored XSS if the bucket were ever moved to a subdomain of the app's domain.

### Requirements

- Remove the `<a href={imageUrl} target="_blank">` wrapper around the drawer's image preview. The preview stays as a plain `<img>` (keep its container styling: rounded, bordered, muted background)
- The existing Download link (`/api/items/[id]/download`) stays the way to get the full file
- `ImageCard` is unchanged: SVGs loaded through `<img>` can't run scripts
- Keep SVG uploads allowed
- In `context/project-overview.md`, add a note in the File Upload Flow section that `R2_PUBLIC_URL` must be on a domain separate from the app (not a subdomain), because uploaded SVGs are served from it as-is

## 2. Shared Helpers

### Prisma error checks

- Add `src/lib/prisma-errors.ts` with:
  - `isUniqueViolation(error)`, moved from `src/lib/db/items.ts` (P2002)
  - `isRecordNotFound(error)` (P2025)
- `updateItem` and `deleteItem` in `src/lib/db/items.ts` use `isRecordNotFound` in place of their copy-pasted `PrismaClientKnownRequestError` / `P2025` checks
- The register route (`src/app/api/auth/register/route.ts`) uses `isUniqueViolation` in place of its inline P2002 check
- `src/actions/items.ts` imports `isUniqueViolation` from the new module. Update its mock in `src/actions/items.test.ts`

### Item type defaults

- `DEFAULT_TYPE_ICON` (`"File"`) and `DEFAULT_TYPE_COLOR` (`"#6b7280"`) are defined in both `src/lib/db/items.ts` and `src/lib/db/collections.ts`. Export them once from `src/lib/item-type-icons.ts` (which already holds the icon map) and import them in both files

### API route responses

- Add `src/lib/api-response.ts` with:
  - `jsonResponse(body, status)`, returning `NextResponse.json(body, { status })`
  - `rateLimitedResponse(body, reset)`, returning a 429 with the `Retry-After` header from `retryAfterSeconds(reset)`
- Replace the local `respond` helpers in `src/app/api/auth/register/route.ts`, `src/app/api/items/[id]/route.ts` and `src/app/api/upload/route.ts`, and `errorResponse` in `src/app/api/items/[id]/download/route.ts` (which becomes `jsonResponse({ success: false, error }, status)`)
- The register and upload routes use `rateLimitedResponse` for their 429s
- Keep each route's response type checked: `jsonResponse` is generic over the body type, so `jsonResponse<RegisterResponse>(...)` still catches a wrong shape

## 3. Items List Component

- Add an `ItemsList` server component (`src/components/items/ItemsList.tsx`) that takes the item type's name and the items, and renders:
  - the empty state ("No {type} yet.") when there are no items
  - the `FileRow` list when `isFileType(typeName)`
  - otherwise the grid (`md:grid-cols-2 xl:grid-cols-3`) with `ImageCard` for images (`isImageType`) and `ItemCard` for everything else
- Keep deciding the file list from `items[0].type.name`: the page's `itemType.name` is the display name (e.g. "Files"), not the stored type name `isFileType` expects, and every item on the page shares one type
- The page renders the header as now, then `<ItemsList />`
- Markup and classes stay the same, so the page looks identical

## Tests

- Move the `isUniqueViolation` tests from `src/lib/db/items.test.ts` to `src/lib/prisma-errors.test.ts` and add `isRecordNotFound` tests (P2025 true, P2002 false, a plain `Error` false)
- Add `src/lib/api-response.test.ts`: `jsonResponse` status and body, and `rateLimitedResponse` status 429, body and `Retry-After`
- Existing `updateItem` and `deleteItem` query tests still pass unchanged
- No unit tests for the preview or `ItemsList` (component changes; `isFileType` and `isImageType` are already tested)
- `npm test`, typecheck, lint and `npm run build` pass

## Notes

- Verify on the dev server as the demo user:
  - an image item's drawer still shows the preview, clicking it no longer opens a new tab, and Download still saves the file
  - `/items/snippets` (grid), `/items/images` (gallery), `/items/files` (list) and an empty type (empty-state message) look as before at 1440px and 390px
  - with curl, status codes and bodies are unchanged: register (201, 400, 409), `GET /api/items/{id}` signed out (401) and unknown (404), upload signed out (401), and download for an unknown id (404)
- Not doing: a Cloudflare response header rule (`Content-Security-Policy: sandbox`) on the bucket. That's a dashboard setting and can be added later if the bucket ever needs to share the app's domain.
