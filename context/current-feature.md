# Current Feature: Code Scan Fixes

Fix the 2 medium and 4 low findings from the `code-scanner` full codebase scan. Behavior and UI stay exactly the same.

## Status

In Progress

## Goals

- `getDemoUserId` and `getCollectionsByRecentUse` wrapped in React `cache()` so each runs once per request (dashboard page + sidebar)
- `getCollectionsByRecentUse` no longer loads every item row: `_count` for `itemCount`, DB-side aggregate for type usage and recency (typed `$queryRaw` acceptable); `CollectionWithTypes` shape and sort order unchanged
- `getPinnedItems` takes a `limit` (10, matching Recent Items), passed from the dashboard page
- New `src/lib/demo-user.ts` exporting `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD` (no Prisma/Next.js imports), used by `src/lib/db/collections.ts`, `prisma/seed.ts` and `scripts/test-db.ts`
- New migration adding a partial unique index on `ItemType.name` where `"userId" IS NULL` (created with `prisma migrate dev --create-only`, SQL hand-edited — never `db push`); seed's find-or-create logic kept

## Notes

- Spec: `context/features/code-scan-fixes/code-scan-fixes-1-spec.md`
- Collection `lastUsedAt` = latest of the collection's `updatedAt` and each item's `lastUsedAt ?? updatedAt` — must stay the same
- Auth intentionally not implemented yet; hardcoded demo user is not a finding
- `.env` is gitignored and untracked — no action needed; no components need splitting
- Verify the dashboard and sidebar render identically before and after (counts, collection order, type icons, border colors)
- Run `npx prisma migrate status`, `npm run db:test`, `npm run lint` and `npm run build`
- Partial index is declared in the schema (`partialIndexes` preview feature) instead of hand-edited SQL, so future migrations don't drop it as drift. Migration SQL generated with `migrate diff` (`migrate dev` refuses the unique-constraint warning non-interactively) and applied to the dev branch with `migrate deploy`
- Production Neon branch still needs `prisma migrate deploy` for the new migration

## History

<!-- Keep this updated.  Earliest to latest -->

- **Initial Next.js and Tailwind setup** — Completed. Scaffolded with Create Next App (Next.js 16, TypeScript, Tailwind v4), removed default boilerplate assets, and added project context docs.
- **Dashboard UI Phase 1** — Completed. Initialized shadcn/ui (Button, Input, Kbd), enabled dark mode by default, added the `/dashboard` route with a top bar (search, New Collection and New Item buttons — display only) and placeholder sidebar and main areas.
- **Dashboard UI Phase 2** — Completed. Added the shadcn Sidebar (plus Avatar, Collapsible, Sheet, Tooltip, Separator) with icon-collapse on desktop and a drawer on mobile, toggled from the top bar or Ctrl/⌘+B. Sidebar shows the DevStash logo, collapsible Types (colored icons, counts, links to `/items/{slug}`) and Collections (Favorites and Recent) sections, and a user avatar area at the bottom, all from mock data. Rewrote `use-mobile` with `useSyncExternalStore` to pass lint.
- **Dashboard UI Phase 3** — Completed. Added shadcn Card and Badge and built the dashboard main area from mock data: page header, 4 stats cards (items, collections, favorite items, favorite collections), a Collections grid sorted by recent use (type-colored border, favorite star, item count, type icons), and Pinned and Recent Items lists (up to 10) with type icon, pin/favorite markers, tags and date. Moved the collection recency helper into `mock-data.ts` and added an `ItemTypeIcon` component to render icons by name.
- **Prisma + Neon PostgreSQL Setup** — Completed. Added Prisma 7.10.0 (stayed on 7 since Prisma 8 is still an RC) with the Neon driver adapter. Uses the new `prisma-client` generator (output `src/generated/prisma`, gitignored), `prisma.config.ts` with dotenv (CLI uses the direct `DIRECT_URL`, app uses the pooled `DATABASE_URL`), and a `postinstall` script for `prisma generate`. Created the initial schema from the project overview plus Auth.js models, with cascade deletes and extra foreign-key indexes, and applied the `init` migration to the Neon development branch. Added a shared, hot-reload-safe client in `src/lib/prisma.ts` and a `scripts/test-db.ts` connection/cascade test (`npm run db:test`, via tsx).
- **Seed Data** — Completed. Added `prisma/seed.ts` (run with `npx prisma db seed`, wired up in `prisma.config.ts` via tsx) and installed `bcryptjs`. Seeds the demo user (`demo@devstash.io`, bcrypt-hashed password, free plan, email verified), the 7 system item types, and 5 collections (React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources) with 18 realistic items linked through `ItemCollection`. Safe to re-run: upserts the user, finds or creates system types (null `userId` can't be upserted on the unique key), and recreates the demo user's collections and items. Extended `scripts/test-db.ts` to verify and display the demo user, system types and collections against the spec.
- **Dashboard Collections** — Completed. Replaced the mock collections in the dashboard main area with data from Neon via Prisma. Added `src/lib/db/collections.ts` (`getDemoUserId`, `getRecentCollections`, `getCollectionStats`); the dashboard page is now an async, dynamically rendered server component that shows the 6 most recently used collections for the demo user (temporary until auth). Each card's border color comes from its most-used item type, with icons for all its types (most-used first). The Collections and Favorite Collections stats now come from the database. The sidebar collections, Pinned and Recent items, and the item stats remain on mock data.
- **Dashboard Items** — Completed. Replaced the mock Pinned and Recent items and the item stats in the dashboard main area with data from Neon via Prisma. Added `src/lib/db/items.ts` (`getPinnedItems`, `getRecentItems`, `getItemStats`); recent items are ordered by `lastUsedAt` (never-used items fall back to `updatedAt`) and limited to 10. Item cards take their icon, color and border from the item type and show tags from the database; the description is hidden when empty. The Pinned section is hidden when nothing is pinned, and Recent Items shows an empty state. All dashboard queries run in parallel. The sidebar remains on mock data.
- **Stats & Sidebar** — Completed. Moved the sidebar from mock data to Neon via Prisma. Added `getItemTypesWithCounts` to `src/lib/db/items.ts` (system types in a fixed order, then custom types; display names and `/items/{slug}` links derived from the type name, with per-user item counts) and `getSidebarCollections` to `src/lib/db/collections.ts` (all favorites plus the 5 most recently used others, sharing a query with `getRecentCollections`). `AppSidebar` is now an async server component. Favorite collections keep the star; recent collections show a colored dot for their most-used item type; added a "View all collections" link to `/collections`. Trimmed `mock-data.ts` to just `currentUser` (still used by `UserNav`). The seed now favorites 2 collections and 3 items and pins 3 items.
- **Add Pro Badge to Sidebar** — Completed. Added a subtle, uppercase `PRO` shadcn `Badge` (outline, muted, 10px) after the Files and Images type names in the sidebar, hidden when the sidebar is collapsed to icons. `getItemTypesWithCounts` now returns an `isPro` flag, set only for the built-in `file` and `image` system types (`PRO_SYSTEM_TYPES`), so custom types with the same name aren't badged. Display only — no plan gating.
