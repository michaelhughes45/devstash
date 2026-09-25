# Current Feature

**Dashboard Collections** — Replace the mock collection data in the dashboard main area with real data from the Neon database via Prisma. Keep the current design (6 recent collection cards). Do not add the items underneath yet.

## Status

Completed

## Goals

- Create `src/lib/db/collections.ts` with data fetching functions
- Fetch collections directly in the server component (instead of `src/lib/mock-data.ts`)
- Collection card border color derived from the most-used content type in that collection
- Show small icons of all types in that collection
- Keep the current design (reference `context/screenshots/dashboard-ui-main.png` if needed)
- Update the collection stats display

## Notes

- Items below the collections (Pinned / Recent) stay on mock data for now — they will be migrated later.
- Spec: `context/features/dashboard-collections-spec.md`

## History

<!-- Keep this updated.  Earliest to latest -->

- **Initial Next.js and Tailwind setup** — Completed. Scaffolded with Create Next App (Next.js 16, TypeScript, Tailwind v4), removed default boilerplate assets, and added project context docs.
- **Dashboard UI Phase 1** — Completed. Initialized shadcn/ui (Button, Input, Kbd), enabled dark mode by default, added the `/dashboard` route with a top bar (search, New Collection and New Item buttons — display only) and placeholder sidebar and main areas.
- **Dashboard UI Phase 2** — Completed. Added the shadcn Sidebar (plus Avatar, Collapsible, Sheet, Tooltip, Separator) with icon-collapse on desktop and a drawer on mobile, toggled from the top bar or Ctrl/⌘+B. Sidebar shows the DevStash logo, collapsible Types (colored icons, counts, links to `/items/{slug}`) and Collections (Favorites and Recent) sections, and a user avatar area at the bottom, all from mock data. Rewrote `use-mobile` with `useSyncExternalStore` to pass lint.
- **Dashboard UI Phase 3** — Completed. Added shadcn Card and Badge and built the dashboard main area from mock data: page header, 4 stats cards (items, collections, favorite items, favorite collections), a Collections grid sorted by recent use (type-colored border, favorite star, item count, type icons), and Pinned and Recent Items lists (up to 10) with type icon, pin/favorite markers, tags and date. Moved the collection recency helper into `mock-data.ts` and added an `ItemTypeIcon` component to render icons by name.
- **Prisma + Neon PostgreSQL Setup** — Completed. Added Prisma 7.10.0 (stayed on 7 since Prisma 8 is still an RC) with the Neon driver adapter. Uses the new `prisma-client` generator (output `src/generated/prisma`, gitignored), `prisma.config.ts` with dotenv (CLI uses the direct `DIRECT_URL`, app uses the pooled `DATABASE_URL`), and a `postinstall` script for `prisma generate`. Created the initial schema from the project overview plus Auth.js models, with cascade deletes and extra foreign-key indexes, and applied the `init` migration to the Neon development branch. Added a shared, hot-reload-safe client in `src/lib/prisma.ts` and a `scripts/test-db.ts` connection/cascade test (`npm run db:test`, via tsx).
- **Seed Data** — Completed. Added `prisma/seed.ts` (run with `npx prisma db seed`, wired up in `prisma.config.ts` via tsx) and installed `bcryptjs`. Seeds the demo user (`demo@devstash.io`, bcrypt-hashed password, free plan, email verified), the 7 system item types, and 5 collections (React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources) with 18 realistic items linked through `ItemCollection`. Safe to re-run: upserts the user, finds or creates system types (null `userId` can't be upserted on the unique key), and recreates the demo user's collections and items. Extended `scripts/test-db.ts` to verify and display the demo user, system types and collections against the spec.
- **Dashboard Collections** — Completed. Replaced the mock collections in the dashboard main area with data from Neon via Prisma. Added `src/lib/db/collections.ts` (`getDemoUserId`, `getRecentCollections`, `getCollectionStats`); the dashboard page is now an async, dynamically rendered server component that shows the 6 most recently used collections for the demo user (temporary until auth). Each card's border color comes from its most-used item type, with icons for all its types (most-used first). The Collections and Favorite Collections stats now come from the database. The sidebar collections, Pinned and Recent items, and the item stats remain on mock data.
