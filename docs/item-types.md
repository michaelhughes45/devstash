# Item Types

Reference for the 7 built-in (system) item types in DevStash, as they exist in the code today, plus the behavior planned in the feature specs.

**Sources:** `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/item-type-icons.ts`, `src/lib/db/items.ts`, `src/components/dashboard/*`, `context/project-overview.md`, `context/features/*-spec.md`.

> `src/lib/constants.tsx` (listed in the research prompt) does not exist. The icon map lives in `src/lib/item-type-icons.ts`, and type ordering and Pro flags live in `src/lib/db/items.ts`.

---

## How types are stored

- Types are rows in the `ItemType` table: `name`, `icon` (Lucide icon name), `color` (hex), `isSystem`, `userId`.
- System types have `isSystem = true` and `userId = null`. They are created by `seedSystemTypes()` in `prisma/seed.ts`, which finds or creates each one by name and updates its icon and color on re-run.
- A partial unique index (`ItemType_system_name_key`, `name` where `userId IS NULL`) stops duplicate system types. Custom types are unique per user via `@@unique([userId, name])`.
- Each `Item` points at one type through `typeId`. The type doesn't decide which content fields an item uses. That's set per item by `Item.contentType` (`TEXT`, `FILE` or `URL`).
- Type names are stored singular and lowercase (`snippet`, `link`). `getItemTypesWithCounts()` turns them into display names and URL slugs by adding an "s" and capitalizing: `snippet` → "Snippets", `/items/snippets`.
- Fallbacks: a type with no icon uses `File`, an unknown icon name renders `FileIcon`, and a type with no color uses `#6b7280`.

---

## The 7 types

Listed in sidebar order (`SYSTEM_TYPE_ORDER` in `src/lib/db/items.ts`).

| # | Name (DB) | Display / slug | Icon (Lucide) | Color | Content type | Pro badge |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `snippet` | Snippets · `/items/snippets` | `Code` | `#3b82f6` blue | TEXT | — |
| 2 | `prompt` | Prompts · `/items/prompts` | `Sparkles` | `#8b5cf6` purple | TEXT | — |
| 3 | `command` | Commands · `/items/commands` | `Terminal` | `#f97316` orange | TEXT | — |
| 4 | `note` | Notes · `/items/notes` | `StickyNote` | `#fde047` yellow | TEXT | — |
| 5 | `file` | Files · `/items/files` | `File` (`FileIcon`) | `#6b7280` gray | FILE | PRO |
| 6 | `image` | Images · `/items/images` | `Image` (`ImageIcon`) | `#ec4899` pink | FILE | PRO |
| 7 | `link` | Links · `/items/links` | `Link` (`LinkIcon`) | `#10b981` green | URL | — |

### Snippet
- **Purpose:** Reusable code, such as hooks, utilities, components and config files (for example a Dockerfile).
- **Key fields:** `content` (the code), `language` (for syntax highlighting, for example `typescript` or `dockerfile`).
- **Seeded examples:** 4 (React Patterns ×3, DevOps ×1).
- **Planned:** Monaco code editor with a copy button and macOS window styling (`code-editor-spec.md`). AI "Explain Code" (Pro, `ai-explain-spec.md`).

### Prompt
- **Purpose:** Reusable AI prompts and workflows. Seeded prompts use `{{code}}` placeholders.
- **Key fields:** `content` (prompt text, Markdown). `language` is not set.
- **Seeded examples:** 3 (AI Workflows).
- **Planned:** Markdown editor with Write/Preview tabs (`markdown-editor-spec.md`). AI Prompt Optimizer (Pro).

### Command
- **Purpose:** Shell commands you reuse, such as git, docker, npm and deploy one-liners.
- **Key fields:** `content` (the command), `language` (seeded as `bash`).
- **Seeded examples:** 5 (DevOps ×1, Terminal Commands ×4).
- **Planned:** Same Monaco editor as snippets. AI "Explain Code" (Pro).

### Note
- **Purpose:** Free-form Markdown notes, docs and course notes.
- **Key fields:** `content` (Markdown).
- **Seeded examples:** none.
- **Planned:** Markdown editor with Write/Preview tabs. AI Summaries (Pro).

### File
- **Purpose:** Uploaded documents and context files, stored in Cloudflare R2.
- **Key fields:** `fileUrl`, `fileName`, `fileSize` (bytes). `contentType = FILE`.
- **Seeded examples:** none. Uploads are not built yet.
- **Planned (`file-image-spec.md`, `file-display-spec.md`):** 10 MB max. Allowed: `.pdf .txt .md .json .yaml .yml .xml .csv .toml .ini`. Shown as a list row with an icon based on the file extension, name, size, upload date and a download button.

### Image
- **Purpose:** Screenshots, diagrams and design references, stored in R2.
- **Key fields:** `fileUrl`, `fileName`, `fileSize`. `contentType = FILE`.
- **Seeded examples:** none.
- **Planned (`file-image-spec.md`, `image-display-spec.md`):** 5 MB max. Allowed: `.png .jpg .jpeg .gif .webp .svg`. Shown in a gallery grid of 16:9 thumbnail cards instead of the usual item card.

### Link
- **Purpose:** Bookmarks for docs, tools and references.
- **Key fields:** `url`. `contentType = URL`.
- **Seeded examples:** 6 (DevOps ×2, Design Resources ×4).

---

## Classification by content type

| Content type | Types | Fields used | Unused fields |
| --- | --- | --- | --- |
| **TEXT** (default) | snippet, prompt, command, note | `content`, `language` (code types only) | `fileUrl`, `fileName`, `fileSize`, `url` |
| **FILE** | file, image | `fileUrl`, `fileName`, `fileSize` | `content`, `language`, `url` |
| **URL** | link | `url` | `content`, `language`, file fields |

- Nothing in the database enforces this mapping. All content fields are nullable, and `contentType` is a column on `Item`, not `ItemType`. The seed works it out as `url ? URL : TEXT`. Item CRUD will need to set and validate it (Zod) for each type.
- Within TEXT there are two groups. **Code** (snippet, command) uses `language` and gets the code editor and Explain Code. **Prose** (prompt, note) gets the Markdown editor.

---

## Shared properties

Every item has these fields, whatever its type:

| Field | Purpose |
| --- | --- |
| `title` (required), `description` | Card heading and one-line summary |
| `isFavorite`, `isPinned` | Star and pin markers; Pinned section on the dashboard |
| `lastUsedAt` | "Recent" ordering (falls back to `updatedAt` when null) |
| `tags` (`ItemTag` → `Tag`) | Tags for each user, shown as badges |
| `collections` (`ItemCollection`) | Many-to-many; one item can be in several collections |
| `userId`, `createdAt`, `updatedAt` | Owner and timestamps; items are deleted along with their user |

From the type, every item also gets its **icon**, its **color** and its place in the sidebar.

---

## Display differences

**Today:** every type renders the same way. Card queries (`ITEM_CARD_SELECT`) don't select `content`, `language`, `url` or any file field, so the only thing that differs between types is styling:

- **ItemCard**: the left border and icon tile use the type color, and the icon comes from the type. It also shows the title, pin/star markers, description, tags and creation date.
- **CollectionCard**: the left border uses the color of the collection's most-used type, followed by one colored icon for each type it contains.
- **Sidebar (TypesNav)**: colored icon, plural name and item count. Files and Images show an outline `PRO` badge (`PRO_SYSTEM_TYPES`; display only, nothing is gated). The badge is hidden when the sidebar is collapsed.
- **Profile page**: item count per type, with colored icons.

**Planned (feature specs):**

| Type | Editor / view |
| --- | --- |
| snippet, command | Monaco editor, copy button, macOS window styling; Explain tab (Pro) |
| prompt, note | Markdown editor with Write/Preview tabs |
| image | Thumbnail gallery grid (16:9) in place of item cards |
| file | List rows with extension icon, size, date and download button |
| link | No dedicated spec found; `url` is not rendered anywhere yet |

---

## Discrepancies to resolve

1. **Link vs URL naming.** The overview's type table calls the type "URL" with the example `/items/{type}`. The database and code use `link`, so the route is `/items/links`.
2. **Image plan tier.** The overview marks Image as **Free** (and lists "image uploads" in the Free plan), but `PRO_SYSTEM_TYPES` puts a PRO badge on both `file` and `image`. Only File is Pro according to the spec.
3. **Type order.** The overview lists Snippet, Prompt, Note, Command, URL, Image, File. The seed and sidebar use snippet, prompt, command, note, file, image, link.
4. **Missing source.** The research prompt references `src/lib/constants.tsx`, which doesn't exist (see the note at the top).
5. **Seed coverage.** The seed has no note, file or image items, so those types show 0 in the sidebar for the demo user.
