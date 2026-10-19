# Stripe Integration — Phase 2 (Webhooks, Gating & UI)

## Overview

Wire the Phase 1 billing infrastructure into the app: a signed Stripe webhook keeps `isPro` and the subscription ID in sync, the free tier limits and Pro-only file uploads are enforced server-side, deleting an account cancels its subscription, and `/settings` gets a Billing card with upgrade and manage-billing buttons. Webhook flows are tested locally with the Stripe CLI (`stripe listen`).

Depends on Phase 1 (`src/lib/stripe.ts`, `src/lib/usage-limits.ts`, `src/lib/billing.ts`, `getCurrentUser()`, the checkout and portal routes). See `docs/stripe-integration-plan.md` for the full analysis and code sketches.

## Requirements

### Webhook — `src/app/api/webhooks/stripe/route.ts`

- Unauthenticated by design: the signature is the authentication (the proxy doesn't match `/api`, so no proxy change)
- Read the raw body with `await request.text()` and verify with `stripe().webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`; missing signature or secret, or a bad signature → 400
- Pass the event to `handleStripeEvent`; success or an ignored event → 200 `{ received: true }`; a processing error → logged and 500 so Stripe retries
- Handled events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Replays and out-of-order events are safe because each one re-reads the subscription from Stripe

### Feature gating (server-side, source of truth)

- `createItem` (`src/actions/items.ts`): use `getCurrentUser()`; after validation, a free user creating a Pro-only type gets `PRO_TYPE_ERROR`, and a free user at the item limit gets `ITEM_LIMIT_ERROR`. Both checks run before `ownsCollections` / `attachUpload`, the limit check inside the existing `try`, and both call `discardUpload` for any pending upload key
- `createCollection` (`src/actions/collections.ts`): use `getCurrentUser()`; return `COLLECTION_LIMIT_ERROR` when `canCreateCollection` is false
- `POST /api/upload`: use `getCurrentUser()`; after reading the form data's `type`, return **403** "File and image uploads require a Pro subscription." for `isProOnlyItemType(type)` when the user isn't Pro, before file validation and the rate limit
- Limit errors are plain `error`s (no `fieldErrors`), so the existing New Item and New Collection toasts show them unchanged
- Downgraded users keep full access to existing items and files: view, edit, download and delete are never gated (existing images keep showing in the gallery and drawer); only creating above the limits is blocked
- Count-then-create isn't atomic (two simultaneous creates at 49 can end at 51); acceptable for a soft limit

### Account deletion

- `deleteUserAccount` (`src/lib/account.ts`) selects `stripeSubscriptionId` and calls `cancelSubscriptionQuietly()` after the confirmation check passes and before the delete, so a deleted user isn't billed again; the resulting `subscription.deleted` webhook finds no user and is a no-op

### Billing UI

- `getUserProfile` (or a new `getBillingStatus` in `src/lib/db/users.ts`) returns `isPro` and `hasBillingAccount` (`stripeCustomerId !== null`), never raw Stripe IDs
- `src/components/settings/BillingSettings.tsx` (client), a Card with `id="billing"` between Editor and Change password on `/settings`:
  - Props: `isPro`, `hasBillingAccount`, `usage` (from `getUserUsage`)
  - Free: "Free" badge, `{itemCount} / 50 items` and `{collectionCount} / 3 collections`, **Upgrade — $8/month** (primary) and **Upgrade — $72/year** (outline, "save 25%")
  - Pro: "Pro" badge and **Manage billing** (outline)
  - Free user with a billing account (past subscriber): also **Manage billing** for invoices
  - Buttons POST to the checkout / portal route, then `window.location.assign(url)`; `Loader2` spinner on the active button, all buttons disabled while a request runs, `toast.error` on failure (429 included)
- `src/components/settings/UpgradeToast.tsx` (client): when the page gets `?upgraded=1` (read from the page's `searchParams` Promise and passed as a prop, no `useSearchParams`), show `toast.success("Welcome to DevStash Pro!")` once (ref guard for Strict Mode) and `router.replace("/settings")`
- If the webhook hasn't landed when the user returns (`upgraded=1` and not Pro), the card shows "Finishing your upgrade…" and the page does a single `router.refresh()` after about 2 seconds (no polling loop)
- Homepage `PLANS` (`src/components/homepage/content.ts`): signed-in Pro CTA goes to `/settings#billing`; remove the "until Stripe phase 2" comment
- Optional: in `TypeSelector` / `NewItemDialog`, mark Pro-only types for free users with a `PRO` badge and "Upgrade to Pro to upload files and images" instead of letting the form fail (needs `isPro` passed down from `TopBar`)

### Docs

- `context/project-overview.md`: consistent Stripe env var names and roadmap ticks; Image becomes Pro in the item types table, and the Monetization table's Free and Pro features move image uploads to Pro
- Homepage `PLANS` (`src/components/homepage/content.ts`): Free features no longer mention images, and Pro lists file and image uploads; check `FEATURES` and the mini dashboard copy for the same promise

## Testing

Unit tests (Vitest, boundaries mocked):

- `src/actions/items.test.ts` (extend): free user blocked at 50 items with the pending upload discarded; free user rejected for a Pro-only type; Pro user passes both; under the limit passes
- `src/actions/collections.test.ts` (extend): free user blocked at 3; Pro user passes
- Account deletion tests (extend): cancels the subscription when there is one, skips it when there isn't, and still deletes if the cancel fails
- Webhook route logic stays in `src/lib/billing.ts` (tested in Phase 1); the route itself is covered by the manual checks below

Manual (dev server, `stripe listen --forward-to localhost:3000/api/webhooks/stripe --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted` with its `whsec_…` in `.env`, using a **newly registered free user**):

- Settings shows Free, usage counts and both upgrade buttons; at 390px no horizontal scroll
- Monthly upgrade with `4242 4242 4242 4242` → back on `/settings?upgraded=1`, toast, card shows Pro, URL cleaned; `isPro`, `stripeCustomerId` and `stripeSubscriptionId` set on the development branch
- Yearly upgrade on another new user; Checkout cancel leaves the user Free; declined card `4000 0000 0000 0002` and 3DS card `4000 0000 0000 3220` behave as expected
- Webhook with a missing or bad signature → 400; replaying an event is harmless
- Manage billing opens the portal and returns to `/settings`; switching monthly → yearly keeps Pro and the same subscription ID; cancel at period end keeps Pro; cancelling immediately sets `isPro = false`, clears the subscription ID and keeps the customer ID
- Failed renewal: `past_due` keeps Pro; final failure (`unpaid` / `canceled`) removes it
- Former subscriber sees Manage billing and can re-upgrade with the same customer
- Free user: New Item fails with the limit toast at 50 and works again after a delete; New Collection fails at 3; File and Image items fail with an error toast; `POST /api/upload` with `type=file` or `type=image` → 403 with nothing left under R2 `pending/`
- Pro user: more than 50 items, more than 3 collections, and file and image uploads all work
- Downgraded user above the limits can still view, edit, download and delete existing items
- A webhook flipping `isPro` shows on the next page load without signing out
- Deleting a Pro account cancels the subscription in the Stripe Dashboard
- `npm test`, `npm run lint`, `npm run build` pass

## Notes

- Prefer a real test checkout over `stripe trigger checkout.session.completed`, whose fixture customer won't match any user
- The `stripe listen` secret differs from the Dashboard endpoint's; production needs its own endpoint (`https://<app-domain>/api/webhooks/stripe`, same four events) and `STRIPE_WEBHOOK_SECRET` in Vercel
- Before going live: repeat the product, prices and portal setup in Live mode
- The demo user is seeded Pro; decide later whether to keep it that way
- Not in scope: custom types, AI features and export gating (gate with `getCurrentUser().isPro` when each is built), trials
