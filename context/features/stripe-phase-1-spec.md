# Stripe Integration — Phase 1 (Core Infrastructure)

## Overview

Lay the groundwork for DevStash Pro ($8/month or $72/year) with hosted Stripe Checkout and the Customer Portal. This phase adds the Stripe SDK client, the free tier usage limits module, `isPro` on the session, the billing business logic and the checkout and portal API routes. No webhooks, feature gating or UI yet (Phase 2), so nothing here needs the Stripe CLI: everything is covered by unit tests and curl.

See `docs/stripe-integration-plan.md` for the full analysis, code sketches and the reasons behind each decision.

## Requirements

### Setup

- Stripe Dashboard (test mode): "DevStash Pro" product with a $8 monthly and a $72 yearly recurring price; Customer Portal configured and saved (cancel at period end, update payment method, invoices, switch monthly ↔ yearly)
- `.env` has `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY` (and `STRIPE_WEBHOOK_SECRET` for Phase 2)
- `npm install stripe` (v23)
- No migration: `isPro`, `stripeCustomerId` and `stripeSubscriptionId` already exist on `User`

### Stripe client — `src/lib/stripe.ts`

- Lazy `stripe()` that creates the client on first call and throws a clear error if `STRIPE_SECRET_KEY` is unset, so importing it during build or tests never throws
- Don't pass `apiVersion` or `typescript: true` (stripe-node pins the version; the option is obsolete)

### Usage limits — `src/lib/usage-limits.ts`

- Constants: `FREE_ITEM_LIMIT = 50`, `FREE_COLLECTION_LIMIT = 3`, `PRO_ONLY_ITEM_TYPES = ["file", "image"]`
- Error messages: `ITEM_LIMIT_ERROR`, `COLLECTION_LIMIT_ERROR`, `PRO_TYPE_ERROR` ("File and image uploads require a Pro subscription.")
- `isProOnlyItemType(type)`
- `getUserUsage(userId, isPro)` → `{ itemCount, collectionCount, canCreateItem, canCreateCollection }` (both counts in parallel)
- `canCreateItem(userId, isPro)` and `canCreateCollection(userId, isPro)`: Pro users return `true` without querying
- `isProSystemType` in `src/lib/item-type-names.ts` uses `isProOnlyItemType`, so the sidebar `PRO` badge and the gate can't drift apart (Files and Images keep the badge)

### Session `isPro`

- `src/types/next-auth.d.ts`: `Session.user.isPro: boolean`, `JWT.isPro?: boolean`
- `src/auth.ts`: add `isPro` to the `jwt` callback's **existing** `sessionVersion` query (no extra query) and set it on the returned token at sign-in and on every later call
- `src/auth.config.ts`: `session` callback sets `session.user.isPro = token.isPro ?? false` (edge-safe, token only)
- `src/lib/session.ts`: `getCurrentUser()` → `{ id, isPro } | null`
- Because the `jwt` callback runs on every `auth()` call, a DB change to `isPro` shows on the next server request without signing out

### Billing logic — `src/lib/validations/billing.ts` and `src/lib/billing.ts`

- `checkoutSchema`: `{ plan: "monthly" | "yearly" }`; the client sends a plan name, never a price ID
- `priceIdFor(plan)`: maps to the env price IDs, throws if unset
- `isProStatus(status)`: `active`, `trialing` and `past_due` count as Pro (past_due keeps Pro while Stripe retries the card)
- `createCheckoutUrl(userId, plan)`: returns `{ error: "not-found" }` for a missing user and `{ error: "already-pro" }` for a Pro user; otherwise gets or creates the Stripe customer (idempotency key `customer-{userId}`, saved with a conditional `updateMany` so concurrent requests reuse one customer) and creates a subscription Checkout Session with `client_reference_id`, `metadata.userId` and `subscription_data.metadata.userId`, `allow_promotion_codes`, success URL `/settings?upgraded=1` and cancel URL `/settings`, both built with `appUrl()` (never request headers)
- `createPortalUrl(userId)`: `null` when the user has no `stripeCustomerId`, otherwise a portal session URL returning to `/settings`
- `syncSubscription(subscriptionId)`: re-reads the subscription from Stripe and updates the user by customer ID: Pro statuses set `isPro = true` and the subscription ID; anything else sets `isPro = false` and clears the subscription ID but keeps the customer ID
- `handleStripeEvent(event)`: `checkout.session.completed` (subscription mode only) and `customer.subscription.created/updated/deleted` call `syncSubscription`; every other event is ignored. No invoice events
- `cancelSubscriptionQuietly(subscriptionId)`: cancels and logs (never throws) failures; used by account deletion in Phase 2
- Raw Stripe IDs are never returned to the client

### API routes

- `src/lib/rate-limit.ts`: new `billing` limiter, 10 per hour per user
- `POST /api/stripe/checkout`: session (401) → JSON body and `checkoutSchema` (400 "Choose a plan.") → rate limit (429 via `rateLimitedResponse`) → `createCheckoutUrl`; `already-pro` → 409 "You're already on Pro."; success → `{ success: true, data: { url } }`; Stripe errors → 500 "Couldn't start checkout. Please try again."
- `POST /api/stripe/portal`: session (401) → rate limit → `createPortalUrl`; `null` → 400 "No billing account found."; success → `{ success: true, data: { url } }`
- Both use `jsonResponse<…>` from `src/lib/api-response.ts` with a typed `{ success, data?, error? }` response; thin routes, logic in `src/lib/billing.ts`

## Testing

Unit tests (Vitest, `@/lib/stripe`, `@/lib/prisma` and `@/lib/session` mocked, env via `vi.stubEnv`):

- `src/lib/usage-limits.test.ts`:
  - `getUserUsage` returns both counts and flags
  - Free user: `canCreateItem` true at 49 items, **false at exactly 50** and above; `canCreateCollection` true at 2, **false at exactly 3** and above
  - Pro user: all flags true, and `canCreateItem` / `canCreateCollection` don't query Prisma
  - Counts are scoped to the user (`where: { userId }`)
  - `isProOnlyItemType`: `file` and `image` true; `snippet`, `link` and unknown types false
  - `isProSystemType` follows `isProOnlyItemType`
- `src/lib/validations/billing.test.ts`: accepts `monthly` / `yearly`; rejects price IDs, other strings and a missing plan
- `src/lib/billing.test.ts`: `priceIdFor` mapping and missing env; `isProStatus`; `createCheckoutUrl` (missing user, already Pro, reuses an existing customer, creates one, uses `appUrl`, sets `metadata.userId`); `createPortalUrl` (no customer → null); `syncSubscription` (active / past_due → Pro with ID, canceled / unpaid → not Pro with ID cleared and customer kept, expanded vs string customer); `handleStripeEvent` (routes each handled type, ignores one-time checkouts and unknown events); `cancelSubscriptionQuietly` (null ID, swallowed error)
- `src/lib/session.test.ts` (or existing tests): `getCurrentUser` returns `{ id, isPro }`, defaults `isPro` to false, null when signed out

Manual (dev server, signed-in cookie):

- curl `POST /api/stripe/checkout` with `{ "plan": "monthly" }` returns a `checkout.stripe.com` URL that opens; the user's `stripeCustomerId` is set on the development branch and reused on a second call
- Bad plan → 400, signed out → 401, Pro user → 409
- Portal returns 400 before a customer exists and a URL after
- `npm test`, `npm run lint`, `npm run build` pass

## Notes

- **Images are Pro:** decided 2026-10-15, overriding the plan's recommendation. File and image uploads both require Pro; the project overview and homepage pricing copy (which promise images on Free) are updated in Phase 2
- The demo user is seeded with `isPro: true`; test free tier behavior with a newly registered user
- With hosted Checkout the browser never needs a publishable key; keep the env var name in `context/project-overview.md` consistent with `.env`
- Upgrading isn't reflected in the app until the Phase 2 webhook syncs the subscription
- Out of scope: webhook route, gating in actions and the upload route, account-deletion cancel, Billing settings UI, homepage CTA (all Phase 2)
