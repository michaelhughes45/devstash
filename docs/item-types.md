# Item Types

Reference for the 7 built-in (system) item types in DevStash, as they exist in the code today, plus the behavior still planned in the feature specs.

**Sources:** `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/item-type-names.ts`, `src/lib/item-type-icons.ts`, `src/lib/item-content.ts`, `src/lib/file-constraints.ts`, `src/lib/usage-limits.ts`, `src/lib/db/item-types.ts`, `src/lib/db/items.ts`, `src/components/items/*`, `src/components/dashboard/*`, `context/project-overview.md`, `context/features/*-spec.md`.

---

## How types are stored

- Types are rows in the `ItemType` table: `name`, `icon` (Lucide icon name), `color` (hex), `isSystem`, `userId`.
- System types have `isSystem = true` and `userId = null`. They are created by `seedSystemTypes()` in `prisma/seed.ts`, which finds or creates each one by name and updates its icon and color on re-run.
- A partial unique index (`name` where `userId IS NULL`) stops duplicate system types. Custom types are unique per user via `@@unique([userId, name])`.
- Each `Item` points at one type through `typeId`. Which content fields an item uses is set per item by `Item.contentType` (`TEXT`, `FILE` or `URL`), which `createItem` derives from the type (`getContentTypeForType` in `src/lib/item-content.ts`).
- Type names are stored singular and lowercase (`snippet`, `link`). `getTypeDisplayName` and `getTypeSlug` (`src/lib/item-type-names.ts`) add an "s" and capitalize: `snippet` → "Snippets", `/items/snippets`. `getItemTypeBySlug` (`src/lib/db/item-types.ts`) resolves a slug back to a type.
- Fallbacks: a type with no icon uses `File` and one with no color uses `#6b7280` (`DEFAULT_TYPE_ICON`, `DEFAULT_TYPE_COLOR` in `src/lib/item-type-icons.ts`); an unknown icon name renders `FileIcon`.

---

## The 7 types

Listed in sidebar order (`SYSTEM_TYPE_ORDER` in `src/lib/item-type-names.ts`; custom types follow alphabetically).

| # | Name (DB) | Display / slug | Icon (Lucide) | Color | Content type | Plan |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `snippet` | Snippets · `/items/snippets` | `Code` | `#3b82f6` blue | TEXT | Free |
| 2 | `prompt` | Prompts · `/items/prompts` | `Sparkles` | `#8b5cf6` purple | TEXT | Free |
| 3 | `command` | Commands · `/items/commands` | `Terminal` | `#f97316` orange | TEXT | Free |
| 4 | `note` | Notes · `/items/notes` | `StickyNote` | `#fde047` yellow | TEXT | Free |
| 5 | `file` | Files · `/items/files` | `File` (`FileIcon`) | `#6b7280` gray | FILE | Pro |
| 6 | `image` | Images · `/items/images` | `Image` (`ImageIcon`) | `#ec4899` pink | FILE | Pro |
| 7 | `link` | Links · `/items/links` | `Link` (`LinkIcon`) | `#10b981` green | URL | Free |

All 7 can be created from the New Item dialog (`CREATABLE_ITEM_TYPES`). File and Image are Pro only (`PRO_ONLY_ITEM_TYPES`): free users see a `PRO` badge on them and an upgrade note instead of the file picker, and `createItem` and `POST /api/upload` reject them server-side.

### Snippet
- **Purpose:** Reusable code, such as hooks, utilities, components and config files (for example a Dockerfile).
- **Key fields:** `content` (the code), `language` (for syntax highlighting, for example `typescript` or `dockerfile`).
- **Editor:** Monaco (`CodeEditor`), read-only in the drawer and editable in the edit form and New Item dialog, with macOS window dots, the language label and a copy button. Languages and aliases map to Monaco ids via `toMonacoLanguage`; the user's editor preferences apply.
- **Seeded examples:** 4 (React Patterns ×3, DevOps ×1).
- **Planned:** AI "Explain Code" (Pro, `ai-explain-spec.md`).

### Prompt
- **Purpose:** Reusable AI prompts and workflows. Seeded prompts use `{{code}}` placeholders.
- **Key fields:** `content` (prompt text, Markdown). No `language`.
- **Editor:** `MarkdownEditor` with Write and Preview tabs (Preview only in the drawer), rendered with `react-markdown` and `remark-gfm`.
- **Seeded examples:** 3 (AI Workflows).
- **Planned:** AI Prompt Optimizer (Pro).

### Command
- **Purpose:** Shell commands you reuse, such as git, docker, npm and deploy one-liners.
- **Key fields:** `content` (the command), `language` (seeded as `bash`).
- **Editor:** Same Monaco editor as snippets.
- **Seeded examples:** 5 (DevOps ×5).
- **Planned:** AI "Explain Code" (Pro).

### Note
- **Purpose:** Free-form Markdown notes, docs and course notes.
- **Key fields:** `content` (Markdown).
- **Editor:** Same Markdown editor as prompts.
- **Seeded examples:** none.
- **Planned:** AI Summaries (Pro).

### File
- **Purpose:** Uploaded documents and context files, stored in Cloudflare R2.
- **Key fields:** `fileUrl` (unique), `fileName`, `fileSize` (bytes). `contentType = FILE`.
- **Rules (`FILE_CONSTRAINTS`):** 10 MB max. Allowed: `.pdf .txt .md .json .yaml .yml .xml .csv .toml .ini`; the extension decides the stored Content-Type.
- **Display:** `/items/files` shows a single-column list (`FileRow`) with an icon by extension (`getFileIconName`), title, file name, size, upload date and a download button. The drawer shows the name and size with a Download link to `/api/items/[id]/download`.
- **Seeded examples:** none.

### Image
- **Purpose:** Screenshots, diagrams and design references, stored in R2.
- **Key fields:** `fileUrl`, `fileName`, `fileSize`. `contentType = FILE`.
- **Rules (`FILE_CONSTRAINTS`):** 5 MB max. Allowed: `.png .jpg .jpeg .gif .webp .svg`.
- **Display:** `/items/images` shows a gallery of 16:9 thumbnail cards (`ImageCard`) in place of item cards. The drawer shows a plain `<img>` preview (never a link to the raw R2 file) and a Download link.
- **Seeded examples:** none.

### Link
- **Purpose:** Bookmarks for docs, tools and references.
- **Key fields:** `url` (required, http/https only). `contentType = URL`.
- **Display:** a regular item card; the drawer shows the URL as a link only when `safeExternalUrl` accepts it. Quick copy copies the URL.
- **Seeded examples:** 6 (DevOps ×2, plus 4 design links in no collection).

---

## Classification by content type

| Content type | Types | Fields used | Unused fields |
| --- | --- | --- | --- |
| **TEXT** (default) | snippet, prompt, command, note | `content`, `language` (code types only) | `fileUrl`, `fileName`, `fileSize`, `url` |
| **FILE** | file, image | `fileUrl`, `fileName`, `fileSize` | `content`, `language`, `url` |
| **URL** | link | `url` | `content`, `language`, file fields |

- The database doesn't enforce this mapping: all content fields are nullable, and `contentType` is a column on `Item`, not `ItemType`. The app enforces it instead. `createItemSchema` drops fields the type doesn't use, and `updateItem` keeps only the fields `getEditableFields` allows for the stored item (a blank URL on a link is rejected).
- Within TEXT there are two groups. **Code** (snippet, command; `isCodeType`) uses `language` and the Monaco editor. **Markdown** (prompt, note; `isMarkdownType`) uses the Markdown editor. Custom text types get a plain textarea.

---

## Shared properties

Every item has these fields, whatever its type:

| Field | Purpose |
| --- | --- |
| `title` (required), `description` | Card heading and one-line summary |
| `isFavorite`, `isPinned` | Toggled from the drawer (and the card star for favorites); favorites appear on `/favorites`, pinned items on the dashboard and first on list pages |
| `lastUsedAt` | "Recent" ordering (falls back to `updatedAt` when null) |
| `tags` (`ItemTag` → `Tag`) | Tags for each user, shown as badges |
| `collections` (`ItemCollection`) | Many-to-many; one item can be in several collections |
| `userId`, `createdAt`, `updatedAt` | Owner and timestamps; items are deleted along with their user |

From the type, every item also gets its **icon**, its **color** and its place in the sidebar.

---

## Display differences

- **ItemCard** (snippet, prompt, command, note, link and custom types): the left border and icon tile use the type color. It shows the title, pin marker, description, tags, date, a favorite toggle and a quick copy button. Card queries (`ITEM_CARD_SELECT`) don't load `content`; text cards fetch it when copied.
- **ImageCard** (image): 16:9 thumbnail with a hover zoom, title, markers and date.
- **FileRow** (file): list row with extension icon, file name, size, date and download link.
- **Collection pages** mix item and image cards in one grid, with file rows in a list below it.
- **CollectionCard**: the left border uses the color of the collection's most-used type, followed by one colored icon for each type it contains.
- **Sidebar (TypesNav)**: colored icon, plural name and item count. Files and Images show an outline `PRO` badge (`isProSystemType`), hidden when the sidebar is collapsed.
- **Profile page**: item count per type, with colored icons.

---

## Free plan limits

From `src/lib/usage-limits.ts` and `src/lib/plan-limits.ts`: free users can create up to 50 items (`FREE_ITEM_LIMIT`) and 3 collections (`FREE_COLLECTION_LIMIT`), and no file or image items. Pro users have no limits. Existing items stay fully usable after a downgrade. The seeded demo user is on the free plan, with 18 items in 3 collections.

---

## Discrepancies to resolve

1. **Link vs URL naming.** The overview's type table calls the type "URL". The database and code use `link`, so the route is `/items/links`.
2. **Type order.** The overview lists Snippet, Prompt, Note, Command, URL, Image, File. The seed and sidebar use snippet, prompt, command, note, file, image, link.
3. **Seed coverage.** The seed has no note, file or image items, so those types show 0 in the sidebar for the demo user (who, as a free user, can't create files or images).
