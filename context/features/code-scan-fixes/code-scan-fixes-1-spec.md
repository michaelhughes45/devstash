# Code Scan Fixes

## Overview

Fix the issues found by the `code-scanner` agent's full codebase scan. No critical or high-severity issues were found; these are 2 medium and 4 low findings covering duplicate/heavy dashboard queries, an unbounded query, repeated demo-user literals and a seed race condition. Behavior and UI should stay exactly the same.

## Requirements

### Medium

1. **Deduplicate per-request queries**
   - `getDemoUserId()` is called in both `src/app/dashboard/page.tsx` and `src/components/dashboard/AppSidebar.tsx`, so the same `User` lookup runs twice per page load
   - `getRecentCollections` (page) and `getSidebarCollections` (sidebar) both call `getCollectionsByRecentUse`, so the heaviest dashboard query also runs twice
   - Wrap `getDemoUserId` and `getCollectionsByRecentUse` in React's `cache()` so each runs once per request

2. **Slim down `getCollectionsByRecentUse`** (`src/lib/db/collections.ts`)
   - Currently loads every item (with its type) for every collection, then counts, ranks types and sorts in JavaScript
   - Use `_count: { select: { items: true } }` for `itemCount`
   - Compute type usage per collection with a DB-side aggregate instead of loading every item row
   - Collection recency (`lastUsedAt` = latest of the collection's `updatedAt` and each item's `lastUsedAt ?? updatedAt`) must stay the same — this needs a `COALESCE`/`MAX`, so a single typed `prisma.$queryRaw` returning collection id, type id and count/latest-use is acceptable if the Prisma API can't express it
   - Output shape (`CollectionWithTypes`) and sort order must not change

### Low

3. **Cap pinned items** (`src/lib/db/items.ts`)
   - `getPinnedItems` has no `take`, unlike `getRecentItems`
   - Add a `limit` parameter (10, matching Recent Items) and pass it from the dashboard page

4. **Shared demo-user constants**
   - `"demo@devstash.io"` is repeated in `src/lib/db/collections.ts`, `prisma/seed.ts` and `scripts/test-db.ts`
   - The demo password `"12345678"` is repeated in `prisma/seed.ts` and `scripts/test-db.ts`
   - Create `src/lib/demo-user.ts` exporting `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD` and import it in all three files
   - Keep the module free of Prisma/Next.js imports so the tsx scripts can import it

5. **Prevent duplicate system item types**
   - `@@unique([userId, name])` on `ItemType` doesn't stop duplicates when `userId` is null (Postgres treats each `NULL` as distinct), so the seed's `findFirst` then `create` in `seedSystemTypes` could race
   - Add a partial unique index on `name` where `"userId" IS NULL` via a new migration (`prisma migrate dev --create-only`, then hand-edit the SQL) — never `db push`
   - Keep the seed's find-or-create logic; the index is the safety net

## Notes

- Auth is intentionally not implemented yet; the hardcoded demo user was not treated as a finding
- `.env` is gitignored (`.env*`) and not tracked — no action needed
- No components need splitting; current component sizes are fine
- Verify the dashboard and sidebar render identically before and after (counts, collection order, type icons and border colors)
- Run `npx prisma migrate status`, `npm run db:test`, `npm run lint` and `npm run build`
