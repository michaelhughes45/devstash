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
