# Update Item Type Rules

## Overview

Fix a Medium finding from the 2026-10-08 code scan. `createItemSchema` requires a URL for links and drops fields the type doesn't use. `updateItemSchema` (`src/lib/validations/items.ts:78`) is just the shared fields, and the `updateItem` query (`src/lib/db/items.ts`) writes whatever it's given. A direct call to the `updateItem` server action can therefore:

- blank a link's URL (`url: ""` is saved as null), leaving a link with nothing to open or copy
- store `content`, `language` or `url` on a file or image item, or `url` on a snippet, which the item's type never uses

The edit form never sends these, but the server is meant to be the source of truth.

## Requirements

- In the `updateItem` server action (`src/actions/items.ts`), load the owner's item type and content type before saving. Add a small query to `src/lib/db/items.ts` scoped by `{ id, userId }` that selects only `contentType` and `type.name`, and return "Item not found." when it's missing, as now
- Use `getEditableFields` (`src/lib/item-content.ts`) to decide which type-specific fields apply. Fields the type doesn't use are left out of the update, so stored values are never changed by stray input (title, description and tags always apply)
- When `contentType` is `URL`, a missing or blank `url` is rejected with a `url` field error of "URL is required" (the same message as create) and the shared `INVALID_INPUT` error, without saving
- Keep `updateItemSchema` for the field rules it already has. The type rules live in the action, because the schema can't know the stored item's type
- The edit form and the drawer behave the same as now

## Tests

- Action tests (`src/actions/items.test.ts`, Prisma queries mocked):
  - a link update with a blank URL returns the `url` field error and doesn't call the update query
  - a file item update with `content`, `language` and `url` sends none of them to the update query
  - a snippet update with `url` drops it and keeps `content` and `language`
  - a prompt update drops `language`
  - a missing or another user's item still returns "Item not found."
- A query test for the new type lookup (scoped by id and user id, null when missing)
- `npm test`, typecheck, lint and `npm run build` pass

## Notes

- Verify on the dev server as the demo user: edit and save a snippet, a link and a prompt from the drawer and confirm nothing changed. The direct-call cases are covered by the unit tests.
- The lookup adds one small query per save. A race where the type changes between the lookup and the update can't happen, because items can't change type.
