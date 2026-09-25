# Current Feature

<!-- Feature name and short description -->

## Status

<!-- Not Started | In Progress | Completed -->

## Goals

<!-- Goals and requirements -->

## Notes

<!-- Any extra notes -->

## History

<!-- Keep this updated.  Earliest to latest -->

- **Initial Next.js and Tailwind setup** — Completed. Scaffolded with Create Next App (Next.js 16, TypeScript, Tailwind v4), removed default boilerplate assets, and added project context docs.
- **Dashboard UI Phase 1** — Completed. Initialized shadcn/ui (Button, Input, Kbd), enabled dark mode by default, added the `/dashboard` route with a top bar (search, New Collection and New Item buttons — display only) and placeholder sidebar and main areas.
- **Dashboard UI Phase 2** — Completed. Added the shadcn Sidebar (plus Avatar, Collapsible, Sheet, Tooltip, Separator) with icon-collapse on desktop and a drawer on mobile, toggled from the top bar or Ctrl/⌘+B. Sidebar shows the DevStash logo, collapsible Types (colored icons, counts, links to `/items/{slug}`) and Collections (Favorites and Recent) sections, and a user avatar area at the bottom, all from mock data. Rewrote `use-mobile` with `useSyncExternalStore` to pass lint.
- **Dashboard UI Phase 3** — Completed. Added shadcn Card and Badge and built the dashboard main area from mock data: page header, 4 stats cards (items, collections, favorite items, favorite collections), a Collections grid sorted by recent use (type-colored border, favorite star, item count, type icons), and Pinned and Recent Items lists (up to 10) with type icon, pin/favorite markers, tags and date. Moved the collection recency helper into `mock-data.ts` and added an `ItemTypeIcon` component to render icons by name.
- **Prisma + Neon PostgreSQL Setup** — Completed. Added Prisma 7.10.0 (stayed on 7 since Prisma 8 is still an RC) with the Neon driver adapter. Uses the new `prisma-client` generator (output `src/generated/prisma`, gitignored), `prisma.config.ts` with dotenv (CLI uses the direct `DIRECT_URL`, app uses the pooled `DATABASE_URL`), and a `postinstall` script for `prisma generate`. Created the initial schema from the project overview plus Auth.js models, with cascade deletes and extra foreign-key indexes, and applied the `init` migration to the Neon development branch. Added a shared, hot-reload-safe client in `src/lib/prisma.ts` and a `scripts/test-db.ts` connection/cascade test (`npm run db:test`, via tsx).
