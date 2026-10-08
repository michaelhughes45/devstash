# Card Copy Payload

## Overview

Fix a Medium finding from the 2026-10-08 code scan. Card quick copy added `content` to `ITEM_CARD_SELECT`, so the dashboard and `/items/[type]` load every item's full text (up to 100,000 characters each) and send it to the browser as the `text` prop of `CopyItemButton`, even if copy is never clicked. `/items/[type]` has no pagination yet, so a user with many long snippets gets a page of several megabytes.

Cards should only carry small fields. Text content is fetched when the copy button is clicked.

## Requirements

### Card query

- Remove `content` from `ITEM_CARD_SELECT` and `ItemWithType` in `src/lib/db/items.ts`
- Add `content` to `ITEM_DETAIL_SELECT` and `ItemDetail`, so the drawer and the `GET /api/items/[id]` response are unchanged
- Keep `contentType`, `url` and `fileUrl` on cards. They are short, and link and file items can still copy without a request

### Copy button

- `CopyItemButton` takes either the text to copy (link and file items) or the item id (text items)
- Text items: on click, fetch `GET /api/items/{id}` and copy its `content` (the drawer already uses this route, which checks the session and ownership)
- Text items always show the button, since the card no longer knows whether content is empty. If the fetched content is blank, show a "Nothing to copy" toast
- Link and file items show the button only when they have a URL, as now
- Disable the button while the request runs. A failed request (401, 404, network error) shows the existing "Couldn't copy to clipboard" error toast
- Add a helper in `src/lib/item-content.ts` that decides, from the card's fields, whether the card copies inline text, fetches the item, or shows no button. `ItemCard` uses it in place of `getItemCopyText`, and the drawer keeps using `getItemCopyText`

### Clipboard after a request

- Safari rejects `navigator.clipboard.writeText` once the click's user activation has been used up by an `await`. Add a helper to `src/lib/clipboard.ts` that takes a function returning `Promise<string>` and writes with `navigator.clipboard.write([new ClipboardItem({ "text/plain": promise })])` where `ClipboardItem` is available, falling back to `writeText` after the promise resolves. Toasts are the same as `copyToClipboard`

## Tests

- Unit test the new card copy helper (text item → fetch, link with URL → inline text, link or file without URL → no button)
- Update any `src/lib/db/items.test.ts` expectations that include `content` in card results, and check that `getItemDetail` still returns it
- `npm test`, typecheck, lint and `npm run build` pass

## Notes

- Verify on the dev server as the demo user. A long snippet's text should no longer appear in the `/items/snippets` page response (search the HTML/RSC payload for a line from it). Copying from a snippet card, a command card, a link card and a file card should still put the right text on the clipboard without opening the drawer. The drawer's Copy button and content view should be unchanged.
- Image cards and file rows still don't get a copy button.
- This fixes the over-fetch on cards only. Unbounded `/items/[type]` lists are covered by `pagination-spec.md`.
