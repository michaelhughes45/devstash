# Split Item Create Code

## Overview

Split two large files flagged in the 2026-10-08 code scan. Each mixes several jobs. There is no behavior change.

- `src/components/items/NewItemDialog.tsx` (253 lines) holds `TypeSelector`, the file upload step, `NewItemForm` with a 30+ line `submit()` that mixes validation, upload, the create call and toasts, and the dialog shell
- `src/actions/items.ts` (212 lines) mixes R2 upload handling (`discardUpload`, `resolveUpload`, `attachUpload`) with the create, update and delete actions

## Requirements

### New Item dialog

- Move `TypeSelector` (and its props interface) to `src/components/items/TypeSelector.tsx`
- Move the create sequence into a `useCreateItem` hook (`src/hooks/use-create-item.ts`). It owns the progress and field-error state and exposes a `submit(type, values, file)` that checks the other fields first (`updateItemSchema`), uploads the file (`uploadFile`), calls `createItem` and shows the same toasts. `uploadChosenFile` and `withoutFileError` move with it
- `NewItemForm` keeps the form state (type, values, file), `canSubmit`, the type-change reset and the JSX, and calls the hook. `NewItemDialog` keeps the dialog shell
- The order of steps, messages, the disabled state while saving and the reset on close are unchanged

### Upload handling in the actions

- Move `discardUpload`, `resolveUpload`, `attachUpload`, the `FileResolution` type and the `UPLOAD_NOT_FOUND` and `INVALID_UPLOAD` messages from `src/actions/items.ts` to `src/lib/item-uploads.ts` (server-only, no `"use server"`, so they aren't exposed as actions)
- `createItem` imports them. `src/actions/items.ts` then only holds the actions and their result types
- Replace the `(data as { fileKey?: unknown } | null)?.fileKey` cast in `createItem` with a small `getFileKey(data: unknown)` helper in `item-uploads.ts` that returns the value only when it's a string

## Tests

- Add `src/lib/item-uploads.test.ts` (R2 helpers mocked) for the moved helpers: a key that isn't the user's pending key is rejected and never copied or deleted, a missing object is reported as not found, a wrong extension or an oversized file is rejected without being copied, a valid upload resolves its name, size and type and is copied to the final key, and `getFileKey` for a string, a number, null and a missing field
- Trim `src/actions/items.test.ts` to the action behavior, mocking `@/lib/item-uploads` where that's simpler. Every current case should still be covered in one file or the other
- `npm test`, typecheck, lint and `npm run build` pass

## Notes

- Verify on the dev server as the demo user: create a snippet, a link and an image from the New Item dialog (progress bar, toast, sidebar count updated), a link with a `javascript:` URL is still rejected, and a file over the size limit is still rejected in the dialog.
- Do this one last, since specs 2–4 also touch `src/actions/items.ts` and `src/lib/db/items.ts`.
