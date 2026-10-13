# Dashboard UI Review

**Last review:** 2026-10-13
**Scope:** `/dashboard` as `demo@devstash.io`: top bar, sidebar (expanded, collapsed and mobile drawer), stats, collections grid, Pinned and Recent item cards, item drawer, ⌘K palette
**Method:** Playwright on the dev server at 375px, 768px and 1280px. View only: the drawer, palette and menus were opened and closed, and nothing was created, edited, favorited or pinned.

## Summary

| Severity | Count |
| --- | --- |
| High | 0 |
| Medium | 4 |
| Low | 5 |

No horizontal scroll at any width and no console errors. The main problems are the logo when the sidebar is collapsed, the squeezed search button at tablet width, and small, crowded card buttons and cut-off titles on phones.

## Findings

### [MEDIUM] Logo breaks when the sidebar is collapsed

- **Viewport:** 1280px, after collapsing with Ctrl+B
- **Location:** `[data-sidebar=header] a[href="/dashboard"]` (sidebar header logo)
- **Issue:** The logo tile shrinks to 16×32px and an 8px sliver of the "DevStash" text shows beside it as a clipped "D".
- **Fix:** `shrink-0 size-8` on the logo tile, and hide the text with `group-data-[collapsible=icon]:hidden`.

### [MEDIUM] Search button squeezed at tablet width

- **Viewport:** 768px
- **Location:** `TopBar` search button
- **Issue:** The button is 117px wide and shows only "S…" plus ⌘K. The 256px sidebar and the fully labelled New Collection and New Item buttons take the space. At 375px it looks better ("Search items and…").
- **Fix:** Show New Collection and New Item as icons below `lg`, or hide the ⌘K hint at `md`.

### [MEDIUM] Card star and copy buttons are small and crowded

- **Viewport:** 375px
- **Location:** `FavoriteItemButton` and `CopyItemButton` on `ItemCard`
- **Issue:** Both are 28×28px with a 2px gap, on every card, so mis-taps are likely. In the drawer, the action buttons are 38×32px and Close is 28×28px.
- **Fix:** `size-9` or `size-10` on touch widths, or a wider gap.

### [MEDIUM] Item card titles cut off heavily on phones

- **Viewport:** 375px
- **Location:** `ItemCard`
- **Issue:** Titles truncate early, e.g. "Context provider and c…" and "Next.js multi-stage …", because the 40px icon tile and the date and button column take most of the width.
- **Fix:** Below `sm`, drop the icon tile, or move the date and buttons to a row under the text.

### [LOW] Active Pin hard to see in the drawer

- **Viewport:** All (seen at 1280px)
- **Location:** Item drawer action bar, Pin button
- **Issue:** A pinned item's Pin button has `aria-pressed=true`, but the only visual change is a filled pin icon. An active Favorite turns yellow.
- **Fix:** Give an active Pin its own colour or background, matching Favorite's treatment.

### [LOW] Collection card focus ring wraps only the title

- **Viewport:** All
- **Location:** `CollectionCard` (stretched title link)
- **Issue:** Tabbing to a collection card focuses the title link, and the ring wraps only the title text. Item cards get a full-card ring.
- **Fix:** `focus-visible:outline-none` on the link and `has-[a:focus-visible]:ring-*` on the card.

### [LOW] Collections look the same in the collapsed sidebar

- **Viewport:** Collapsed sidebar
- **Location:** `AppSidebar` collections section
- **Issue:** Every collection shows the same grey folder icon and the colour dots are hidden, so they can't be told apart without hovering.
- **Fix:** Tint each folder with its most-used type colour, and make sure each has a tooltip (tooltips weren't checked).

### [LOW] Other small tap targets on phones

- **Viewport:** 375px
- **Location:** "View all" link (50×20px), mobile sidebar drawer rows (32px tall), Toggle Sidebar button (28×28px)
- **Fix:** More padding or a larger minimum height at touch widths.

### [LOW] Snippet starts with leading spaces (data)

- **Viewport:** All (seen in the drawer at 1280px)
- **Location:** "Next.js multi-stage Dockerfile" seed item
- **Issue:** The first line starts with 9 spaces (`"         FROM node:22-alpine…"`), so it renders indented with indent guides. This is a seed data issue, not a UI bug.
- **Fix:** Trim the content in `prisma/seed.ts` and the stored item.

## Looks good

- No horizontal scroll at 375, 768 or 1280px; no console errors or warnings.
- Every icon button has an accessible name (Favorites, Toggle Sidebar, Favorite/Copy "{title}", "{name} options", Delete item, Close, Copy code); favorite toggles use `aria-pressed`; no image is missing alt text.
- Focus rings are visible on top bar buttons, item cards, card menus and the Types toggle; the tab order is logical, and focus returns to the card after the drawer closes.
- The drawer is labelled with the item's title, and Monaco highlighting, tags and dates read well at 375px.
- The ⌘K palette opens with Ctrl+K and from the search button, closes on Escape, has a labelled dialog and input, and fits at 375px.
- The mobile sidebar works as a drawer (titled "Sidebar").
- Stats (4 → 2 → 2 columns) and the collections grid (3 → 2 → 1) reflow cleanly.

## Not checked

- Copy buttons (to avoid clipboard prompts), and favorite, pin or edit actions.
- Hover tooltips in the collapsed sidebar.
- Collapsing the sidebar at 768px.
- Light mode.
- A real screen reader (accessible names were checked through the DOM and accessibility snapshot only).
