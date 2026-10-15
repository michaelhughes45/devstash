# Stripe Integration Plan — DevStash Pro

> Research output for `context/research/stripe-integration-research.md` (2026-10-15).
> Pro: **$8/month** or **$72/year**. Hosted Stripe Checkout + Customer Portal + webhooks.
> Builds on the drafts in `context/features/stripe-phase-1-spec.md` and `stripe-phase-2-spec.md`; where this plan differs from them, the reason is given under [Deviations from the phase specs](#deviations-from-the-phase-specs).

---

## 1. Current State Analysis

### User model (`prisma/schema.prisma`)

The billing columns already exist, so **no migration is needed**:

```prisma
isPro                Boolean @default(false)
stripeCustomerId     String? @unique
stripeSubscriptionId String? @unique
```

- Both Stripe IDs are unique, so a webhook can look a user up by customer ID, and two users can never share a customer.
- `prisma/seed.ts` sets the **demo user to `isPro: true`** (line 333). Once gating ships, the demo account can't exercise the free tier; test free limits with a newly registered user.

### Auth and session

| File | What it does today | Relevance |
| --- | --- | --- |
| `src/auth.config.ts` | Edge-safe config used by `src/proxy.ts`. Its `session` callback copies `token.sub` → `session.user.id`. No DB access. | Add `session.user.isPro = token.isPro ?? false` here (still edge-safe: reads the token only). |
| `src/auth.ts` | Full config: Prisma adapter, JWT strategy, credentials `authorize`, and a `jwt` callback that **already queries the user on every `auth()` call** (`select: { sessionVersion: true }`) to revoke sessions. | Add `isPro` to that same `select`. The research note's "always sync from DB" workaround is effectively free here: **no extra query**. |
| `src/types/next-auth.d.ts` | Adds `user.id` to `Session` and `sessionVersion` to `JWT`. | Add `isPro`. |
| `src/lib/session.ts` | `getSession = cache(auth)`, `getCurrentUserId()`. Every action, route and page goes through it. | Add `getCurrentUser()` returning `{ id, isPro }`. |
| `src/proxy.ts` | Protects page routes only. **`/api` is not matched**; each route checks the session itself. | The webhook route needs no proxy change and must not require a session. |

Because the `jwt` callback runs on every `auth()` call (not just sign-in), `session.user.isPro` is current on every server request. A webhook flipping `isPro` in the DB is visible on the next page load or server action, with no `update()` / `trigger === "update"` dance. Client components never read the session directly (pages pass props), so nothing client-side needs refreshing beyond `router.refresh()` or a reload.

### How user data is accessed

- **Server actions** (`src/actions/*.ts`): `const userId = await getCurrentUserId(); if (!userId) return { success: false, error: NOT_SIGNED_IN };` then Zod `safeParse`, then a `src/lib/db/*` query in `try/catch`, returning `{ success, data }` or `{ success: false, error, fieldErrors? }`. Each file has module-level message constants (`NOT_SIGNED_IN`, `INVALID_INPUT`, `GENERIC_ERROR`, …).
- **Pages**: async server components call `getCurrentUserId()`, redirect to `/sign-in` if absent, and fetch via `src/lib/db/*` (e.g. `/settings` uses `getUserProfile`).
- **Layout data**: `AppShell` loads per-user data (collection options, search data, editor preferences) once and passes it down.

### Existing payment-related code

None. `grep` for `stripe` finds nothing in `src/`. Related bits:

- `isProSystemType()` / `PRO_SYSTEM_TYPES = ["file", "image"]` in `src/lib/item-type-names.ts` — **display only** (sidebar `PRO` badge in `TypesNav`).
- Homepage `PLANS` in `src/components/homepage/content.ts`: the Pro CTA goes to `/register` (signed out) or `/settings` (signed in), with the comment "`/settings` until Stripe phase 2 adds the upgrade flow".
- `src/lib/mock-data.ts` has an unused `isPro` on a mock user (unrelated).
- `stripe` is **not installed**. Latest `stripe` on npm is **23.0.0**.

### Environment variables

`.env` already defines: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`.

- `context/project-overview.md` lists `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` instead. With **hosted** Checkout (redirect to `session.url`) the browser never needs a publishable key, so it can stay unused; just keep the overview and `.env` names consistent.
- Pattern for required env: `requireEnv(name)` in `src/lib/r2.ts` and `appUrl(path)` in `src/lib/app-url.ts` both throw a clear error when unset. Redirect URLs must be built with `appUrl()`, never from request headers (the auth-hardening rule).

---

## 2. Feature Gating Analysis

### Free tier limits (project spec)

| Limit | Free | Pro |
| --- | --- | --- |
| Items | 50 | Unlimited |
| Collections | 3 | Unlimited |
| File uploads | ❌ | ✅ |
| Image uploads | ⚠️ see decision below | ✅ |
| Custom types, AI, export | ❌ (not built yet) | ✅ |

On downgrade: existing items stay readable (and editable); only **creating** above the limits is blocked.

### ⚠️ Decision needed: are images Pro?

The sources disagree:

| Source | Images |
| --- | --- |
| `context/project-overview.md` item types table and Monetization table | **Free** ("All system types except File, image uploads") |
| Homepage `PLANS` Free features | **Free** ("…links and images") |
| Sidebar `PRO_SYSTEM_TYPES` | Badged **Pro** |
| `stripe-phase-2-spec.md` | Gated **Pro** ("File and image uploads require a Pro subscription") |

**Recommendation:** follow the project overview and pricing page (the customer-facing promise): only `file` is Pro, images are free. That means dropping `"image"` from `PRO_SYSTEM_TYPES` and making the gate a single `isProOnlyItemType(type)` helper used by the badge, `createItem` and the upload route. If images should be Pro instead, the overview table and homepage copy must change. The rest of this plan uses a `PRO_ONLY_ITEM_TYPES` constant so either answer is a one-line change.

### Where counts are (or can be) checked

| Need | Existing code | Plan |
| --- | --- | --- |
| Item count | `getItemStats(userId)` in `src/lib/db/items.ts` (`prisma.item.count({ where: { userId } })`, plus favorites) | New `src/lib/usage.ts` with its own `count` calls (only the totals needed) |
| Collection count | `getCollectionStats(userId)` in `src/lib/db/collections.ts` | Same |
| Item create | `createItem` in `src/actions/items.ts` | Check type gate + item limit **before** `ownsCollections` / `attachUpload` (and `discardUpload` the pending key on rejection, matching the existing failure paths) |
| Collection create | `createCollection` in `src/actions/collections.ts` | Check collection limit after validation |
| File upload | `POST /api/upload` (`src/app/api/upload/route.ts`) | Return **403** for a Pro-only type before reading the body |
| UI | `TopBar` renders `NewItemDialog` (types from `getCreatableItemTypes()`) and `NewCollectionDialog` | Server is the source of truth; UI only adds hints (see step 11) |

Count-then-create is not atomic: two simultaneous creates at 49 items can end at 51. That's acceptable for a soft product limit; note it rather than add locking.

### Pro-only features to gate

| Feature | Status | Gate now? |
| --- | --- | --- |
| File uploads | Built (`/api/upload`, `createItem` with `fileKey`) | ✅ Yes — upload route + `createItem` |
| Image uploads | Built | Per decision above |
| Downloads (`/api/items/[id]/download`) | Built | ❌ No — existing files stay accessible after downgrade |
| Custom item types | Not built | Gate when built (`isPro` from `getCurrentUser()`) |
| AI features | Specs exist (`ai-auto-tag-spec.md`, `ai-explain-spec.md`) | Gate when built |
| Export | Not built | Gate when built |

### Settings page structure (`src/app/settings/page.tsx`)

Server component, `max-w-3xl` column of shadcn `Card`s: **Editor** (`EditorPreferencesForm`) → **Change password** (only when `profile.hasPassword`) → **Delete account** (destructive ring). Components live in `src/components/settings/` with PascalCase names. A **Billing** card goes between Editor and Change password.

---

## 3. API & Webhook Patterns

### API routes

- Location `src/app/api/<area>/<name>/route.ts`, exporting `POST`/`GET`.
- Response helper: `const respond = jsonResponse<RouteResponse>;` from `src/lib/api-response.ts` with a typed `{ success, data?, error? }` interface; `rateLimitedResponse(reset)` for 429s.
- Session checked in the route (`getCurrentUserId()` → 401), because the proxy doesn't cover `/api`.
- Input validated with Zod; IDs never trusted from the client (e.g. `createItem` looks up the system type by name server-side).
- Rate limiting via `checkRateLimit(name, key)` in `src/lib/rate-limit.ts` (fails open without Upstash). Add a `billing` limiter.
- Business logic lives in `src/lib/*` so it can be unit-tested (testing rules: only `src/actions` and `src/lib` are tested, with boundaries mocked).

### Server actions

`"use server"` files, message constants at the top, discriminated result types (`CreateItemResult = { success: true; data } | { success: false; error; fieldErrors? }`), `console.error` + `GENERIC_ERROR` in `catch`, client shows `toast.error(result.error)`. A limit error is a plain `error` (no `fieldErrors`), so the existing `useCreateItem` / `NewCollectionDialog` toasts show it unchanged.

### Webhook specifics (Next.js 16 App Router)

- Route handlers get the raw body via `await request.text()`; no body-parser config.
- The proxy matcher excludes `/api`, so Stripe's unauthenticated POST reaches the route.
- Verify with `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`; 400 on failure.
- Stripe retries non-2xx responses, so return 500 on processing errors (DB down) and 200 for events we ignore.

### Stripe API changes to be aware of (stripe-node 23)

Recent API versions moved fields the phase specs rely on:

- `invoice.subscription` is gone; it's now `invoice.parent?.subscription_details?.subscription`.
- `subscription.current_period_end` moved to **subscription items** (`subscription.items.data[0].current_period_end`).
- stripe-node pins the API version per SDK release, so don't pass `apiVersion` unless you need to; `typescript: true` is no longer needed.

This plan avoids invoice events entirely (see the webhook section), which sidesteps the first change.

---

## 4. Files to Create

### 4.1 `src/lib/stripe.ts` — SDK client

Lazy, so importing it in a module that's loaded during build or tests doesn't throw when the key is unset (same idea as `r2Client()`).

```typescript
import Stripe from "stripe";

let client: Stripe | undefined;

export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key);
  }
  return client;
}
```

### 4.2 `src/lib/usage.ts` — free tier limits

```typescript
import { prisma } from "@/lib/prisma";

export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;

// Item types only Pro users can create (see the images decision)
export const PRO_ONLY_ITEM_TYPES = ["file"] as const;

export const ITEM_LIMIT_ERROR = `You've reached the free plan limit of ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited items.`;
export const COLLECTION_LIMIT_ERROR = `You've reached the free plan limit of ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro for unlimited collections.`;
export const PRO_TYPE_ERROR = "File uploads require a Pro subscription.";

export interface UserUsage {
  itemCount: number;
  collectionCount: number;
  canCreateItem: boolean;
  canCreateCollection: boolean;
}

export function isProOnlyItemType(type: string): boolean {
  return (PRO_ONLY_ITEM_TYPES as readonly string[]).includes(type);
}

export async function getUserUsage(userId: string, isPro: boolean): Promise<UserUsage> {
  const [itemCount, collectionCount] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
  ]);
  return {
    itemCount,
    collectionCount,
    canCreateItem: isPro || itemCount < FREE_ITEM_LIMIT,
    canCreateCollection: isPro || collectionCount < FREE_COLLECTION_LIMIT,
  };
}

// Pro users skip the query entirely
export async function canCreateItem(userId: string, isPro: boolean): Promise<boolean> {
  if (isPro) return true;
  return (await prisma.item.count({ where: { userId } })) < FREE_ITEM_LIMIT;
}

export async function canCreateCollection(userId: string, isPro: boolean): Promise<boolean> {
  if (isPro) return true;
  return (await prisma.collection.count({ where: { userId } })) < FREE_COLLECTION_LIMIT;
}
```

`isProSystemType` in `src/lib/item-type-names.ts` should then use `isProOnlyItemType` so the sidebar badge and the gate can't drift apart.

### 4.3 `src/lib/validations/billing.ts`

The client sends a plan name, never a price ID.

```typescript
import { z } from "zod";

export const BILLING_PLANS = ["monthly", "yearly"] as const;
export type BillingPlan = (typeof BILLING_PLANS)[number];

export const checkoutSchema = z.object({
  plan: z.enum(BILLING_PLANS, { error: "Choose a plan" }),
});
```

### 4.4 `src/lib/billing.ts` — all Stripe business logic

Routes stay thin; this module is what gets unit-tested (with `@/lib/stripe` and `@/lib/prisma` mocked).

```typescript
import type Stripe from "stripe";

import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import type { BillingPlan } from "@/lib/validations/billing";

// past_due keeps Pro while Stripe retries the card; it ends at "canceled"/"unpaid"
const PRO_STATUSES: Stripe.Subscription.Status[] = ["active", "trialing", "past_due"];

export function isProStatus(status: Stripe.Subscription.Status): boolean {
  return PRO_STATUSES.includes(status);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export function priceIdFor(plan: BillingPlan): string {
  return requireEnv(plan === "monthly" ? "STRIPE_PRICE_ID_MONTHLY" : "STRIPE_PRICE_ID_YEARLY");
}

// Creates the customer once; the conditional update means a second concurrent
// request reuses the winner's customer instead of overwriting it
async function getOrCreateCustomerId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, stripeCustomerId: true },
  });
  if (!user) return null;
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe().customers.create(
    { email: user.email, name: user.name ?? undefined, metadata: { userId } },
    { idempotencyKey: `customer-${userId}` },
  );
  await prisma.user.updateMany({
    where: { id: userId, stripeCustomerId: null },
    data: { stripeCustomerId: customer.id },
  });
  const saved = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  return saved?.stripeCustomerId ?? null;
}

export type CheckoutResult =
  | { url: string }
  | { error: "not-found" | "already-pro" };

export async function createCheckoutUrl(userId: string, plan: BillingPlan): Promise<CheckoutResult> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPro: true } });
  if (!user) return { error: "not-found" };
  // Prevents a second subscription from a stale tab; Pro users manage billing in the portal
  if (user.isPro) return { error: "already-pro" };

  const customerId = await getOrCreateCustomerId(userId);
  if (!customerId) return { error: "not-found" };

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: userId,
    line_items: [{ price: priceIdFor(plan), quantity: 1 }],
    metadata: { userId },
    subscription_data: { metadata: { userId } },
    success_url: appUrl("/settings?upgraded=1").toString(),
    cancel_url: appUrl("/settings").toString(),
    allow_promotion_codes: true,
  });
  if (!session.url) throw new Error("Checkout session has no URL");
  return { url: session.url };
}

export async function createPortalUrl(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) return null;

  const session = await stripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: appUrl("/settings").toString(),
  });
  return session.url;
}

function idOf(value: string | { id: string } | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

// Re-reads the subscription from Stripe, so out-of-order or duplicate events
// all converge on Stripe's current state
export async function syncSubscription(subscriptionId: string): Promise<void> {
  const subscription = await stripe().subscriptions.retrieve(subscriptionId);
  const customerId = idOf(subscription.customer);
  if (!customerId) return;

  const active = isProStatus(subscription.status);
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      isPro: active,
      stripeSubscriptionId: active ? subscription.id : null,
    },
  });
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const subscriptionId = idOf(session.subscription);
      if (session.mode === "subscription" && subscriptionId) {
        await syncSubscription(subscriptionId);
      }
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object.id);
      return;
    default:
      return;
  }
}

// Called before deleting an account so a deleted user isn't billed again
export async function cancelSubscriptionQuietly(subscriptionId: string | null): Promise<void> {
  if (!subscriptionId) return;
  try {
    await stripe().subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error("Stripe subscription cancel failed", error);
  }
}
```

Notes:
- A subscription in a non-Pro state **clears** `stripeSubscriptionId` but keeps `stripeCustomerId`, so a returning user reuses the same customer (and portal history).
- If a user somehow ends up with two subscriptions, the one deleted last would set `isPro: false`. `createCheckoutUrl` refusing Pro users prevents that in practice; the portal's "one subscription per customer" setting (see Dashboard setup) closes it fully.

### 4.5 `src/app/api/stripe/checkout/route.ts`

```typescript
import { jsonResponse, rateLimitedResponse } from "@/lib/api-response";
import { createCheckoutUrl } from "@/lib/billing";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCurrentUserId } from "@/lib/session";
import { checkoutSchema } from "@/lib/validations/billing";

interface CheckoutResponse {
  success: boolean;
  data?: { url: string };
  error?: string;
}

const respond = jsonResponse<CheckoutResponse>;

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return respond({ success: false, error: "Unauthorized" }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond({ success: false, error: "Invalid request." }, 400);
  }
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return respond({ success: false, error: "Choose a plan." }, 400);

  const limit = await checkRateLimit("billing", userId);
  if (!limit.success) return rateLimitedResponse(limit.reset);

  try {
    const result = await createCheckoutUrl(userId, parsed.data.plan);
    if ("error" in result) {
      return result.error === "already-pro"
        ? respond({ success: false, error: "You're already on Pro." }, 409)
        : respond({ success: false, error: "Unauthorized" }, 401);
    }
    return respond({ success: true, data: { url: result.url } }, 200);
  } catch (error) {
    console.error("Stripe checkout failed", error);
    return respond({ success: false, error: "Couldn't start checkout. Please try again." }, 500);
  }
}
```

### 4.6 `src/app/api/stripe/portal/route.ts`

Same shape: session → rate limit → `createPortalUrl(userId)`; `null` → 400 "No billing account found."; success → `{ success: true, data: { url } }`.

### 4.7 `src/app/api/webhooks/stripe/route.ts`

```typescript
import type Stripe from "stripe";

import { jsonResponse } from "@/lib/api-response";
import { handleStripeEvent } from "@/lib/billing";
import { stripe } from "@/lib/stripe";

const respond = jsonResponse<{ received?: boolean; error?: string }>;

// Unauthenticated by design: the signature is the authentication. The proxy doesn't match /api.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return respond({ error: "Missing signature" }, 400);

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return respond({ error: "Invalid signature" }, 400);
  }

  try {
    await handleStripeEvent(event);
    return respond({ received: true }, 200);
  } catch (error) {
    // Non-2xx makes Stripe retry later
    console.error(`Stripe webhook ${event.type} failed`, error);
    return respond({ error: "Webhook handler failed" }, 500);
  }
}
```

### 4.8 `src/components/settings/BillingSettings.tsx` (client)

PascalCase per the coding standards (the phase spec's `billing-settings.tsx` doesn't match the folder's other files).

- Props: `isPro: boolean`, `hasBillingAccount: boolean`, `usage: UserUsage`.
- Free: `Badge` "Free", usage lines `{itemCount} / 50 items` and `{collectionCount} / 3 collections` (a small bar each is optional), and two buttons: **Upgrade — $8/month** (primary) and **Upgrade — $72/year** (outline, "save 25%").
- Pro: `Badge` "Pro" and **Manage billing** (outline).
- Free user with `hasBillingAccount` (a past subscriber): also show **Manage billing** for invoices.
- Buttons `fetch` POST the route, then `window.location.assign(data.url)`; a `Loader2` spinner on the active button; all disabled while any request runs; `toast.error(data.error)` on failure (429 included).

### 4.9 `src/components/settings/UpgradeToast.tsx` (client)

Shows `toast.success("Welcome to DevStash Pro!")` when `?upgraded=1`, then `router.replace("/settings")` to clear it. Read the param in the page (`searchParams` prop is a Promise in Next.js 16) and pass `upgraded` as a prop rather than using `useSearchParams` (avoids a Suspense boundary). Use a ref guard so React Strict Mode doesn't toast twice.

If the webhook hasn't landed yet when the user returns (usually < 1–2 s), the card may still say Free. Handle it by having the page show "Finishing your upgrade…" when `upgraded=1 && !isPro`, plus a single `router.refresh()` after ~2 s. No polling loop.

### 4.10 Tests

| File | Covers |
| --- | --- |
| `src/lib/usage.test.ts` | Counts and flags; `false` at exactly 50 items / 3 collections; Pro bypass without querying; `isProOnlyItemType` |
| `src/lib/billing.test.ts` | `priceIdFor` mapping and missing env; `isProStatus`; `createCheckoutUrl` (already Pro, reuses existing customer, creates one, uses `appUrl`, sets `metadata.userId`); `createPortalUrl` (no customer → null); `syncSubscription` (active/past_due → Pro + ID, canceled/unpaid → not Pro, ID cleared, expanded vs string customer); `handleStripeEvent` (routes each type, ignores one-time checkouts and unknown events) |
| `src/lib/validations/billing.test.ts` | Accepts `monthly`/`yearly`; rejects price IDs and other strings |
| `src/actions/items.test.ts` (extend) | Free user blocked at the limit (and pending upload discarded), Pro-only type rejected for free user, Pro user passes |
| `src/actions/collections.test.ts` (extend) | Free user blocked at 3; Pro passes |
| `src/actions/profile.test.ts` / `src/lib/account` tests (extend) | Account delete cancels the subscription |

Mock `@/lib/stripe` (`vi.mock` returning a fake `stripe()`), `@/lib/prisma` and `@/lib/session`, as the existing tests do. Stub env with `vi.stubEnv`.

---

## 5. Files to Modify

| File | Change |
| --- | --- |
| `package.json` | `npm install stripe` |
| `src/types/next-auth.d.ts` | `Session.user.isPro: boolean`; `JWT.isPro?: boolean` |
| `src/auth.ts` | `jwt` callback: `select: { sessionVersion: true, isPro: true }`, and set `isPro: current.isPro` on the returned token in both branches (see below) |
| `src/auth.config.ts` | `session` callback: `session.user.isPro = token.isPro ?? false` |
| `src/lib/session.ts` | Add `getCurrentUser()` → `{ id, isPro } \| null` |
| `src/actions/items.ts` | `createItem`: use `getCurrentUser()`; after validation, reject Pro-only types (`PRO_TYPE_ERROR`) and the item limit (`ITEM_LIMIT_ERROR`), calling `discardUpload(userId, getFileKey(data))` on rejection |
| `src/actions/collections.ts` | `createCollection`: use `getCurrentUser()`; return `COLLECTION_LIMIT_ERROR` when `canCreateCollection` is false |
| `src/app/api/upload/route.ts` | Use `getCurrentUser()`. Since `type` is in the form data, the order is: auth → content-length checks → `formData()` → type check → **Pro check** (403 "File uploads require a Pro subscription." for `isProOnlyItemType(type)` when not Pro) → file validation → rate limit |
| `src/lib/rate-limit.ts` | Add `billing: { limit: 10, window: "1 h" }` |
| `src/lib/item-type-names.ts` | `isProSystemType` uses `isProOnlyItemType` (removes `image` if images stay free) |
| `src/lib/account.ts` | `deleteUserAccount`: select `stripeSubscriptionId` and call `cancelSubscriptionQuietly()` after confirmation succeeds, before the delete transaction |
| `src/app/settings/page.tsx` | Accept `searchParams`; fetch `getUserUsage` and the Stripe fields; render the Billing card between Editor and Change password; render `UpgradeToast` |
| `src/lib/db/users.ts` | `getUserProfile` (or a new `getBillingStatus`) also returns `isPro` and `hasBillingAccount` (`stripeCustomerId !== null`), never the raw IDs |
| `src/components/homepage/content.ts` | Pro CTA signed in → `/settings#billing` (add `id="billing"` to the card); drop the "until Stripe phase 2" comment |
| `src/components/items/TypeSelector.tsx` / `NewItemDialog.tsx` | Optional UX: for free users, mark Pro-only types with a `PRO` badge and a hint ("Upgrade to Pro to upload files") instead of letting them fill the form and fail. Needs `isPro` passed down from `TopBar` (`getCurrentUser()`) |
| `context/project-overview.md` | Fix the Stripe env var name, tick roadmap items, and record the images decision |

`src/auth.ts` `jwt` callback after the change:

```typescript
async jwt({ token, user }) {
  const userId = user?.id ?? token.sub;
  if (!userId) return null;

  // One query serves both revocation and Pro status, so webhook changes show on the next request
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessionVersion: true, isPro: true },
  });
  if (!current) return null;

  if (user) return { ...token, sessionVersion: current.sessionVersion, isPro: current.isPro };
  if (token.sessionVersion !== current.sessionVersion) return null;
  return { ...token, isPro: current.isPro };
},
```

`src/lib/session.ts` addition:

```typescript
export interface CurrentUser {
  id: string;
  isPro: boolean;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  const id = session?.user?.id;
  return id ? { id, isPro: session.user.isPro ?? false } : null;
}
```

`createItem` gate (inserted right after `safeParse` succeeds):

```typescript
const user = await getCurrentUser();
if (!user) return { success: false, error: NOT_SIGNED_IN };
const { id: userId, isPro } = user;
// ...existing parse...

if (!isPro && isProOnlyItemType(type)) {
  await discardUpload(userId, uploadKey);
  return { success: false, error: PRO_TYPE_ERROR };
}
if (!(await canCreateItem(userId, isPro))) {
  await discardUpload(userId, uploadKey);
  return { success: false, error: ITEM_LIMIT_ERROR };
}
```

(The limit check must be inside the existing `try`, since it queries the DB.)

The proxy (`src/proxy.ts`) needs **no change**: `isPro` in the edge session is whatever the cookie's JWT says, but nothing in the proxy gates on it.

---

## 6. Stripe Dashboard Setup

Do everything in **Test mode** first; repeat for Live mode before launch.

1. **Product**: Products → Add product → "DevStash Pro".
   - Price 1: $8.00 USD, recurring, monthly → copy the `price_…` ID to `STRIPE_PRICE_ID_MONTHLY`.
   - Price 2: $72.00 USD, recurring, yearly → `STRIPE_PRICE_ID_YEARLY`.
2. **API key**: Developers → API keys → secret key (`sk_test_…`) → `STRIPE_SECRET_KEY`. Consider a **restricted key** with write access to Customers, Checkout Sessions, Customer portal, Subscriptions only.
3. **Customer portal**: Settings → Billing → Customer portal:
   - Allow cancel (at period end), update payment method, view invoices.
   - Allow switching between the monthly and yearly prices (add both to the product catalog section).
   - Business info: privacy and terms URLs (placeholders OK in test mode).
   - Save; the portal API errors until a configuration is saved.
4. **Checkout settings**: Settings → Checkout and Payment Links → enable "Limit customers to one subscription" if offered for your account; it backs up the `already-pro` check.
5. **Webhook endpoint (production)**: Developers → Webhooks → Add endpoint → `https://<app-domain>/api/webhooks/stripe`, events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   Copy the signing secret (`whsec_…`) to the production `STRIPE_WEBHOOK_SECRET` (Vercel env).
6. **Local webhooks**: install the Stripe CLI (Windows: `scoop install stripe` or the release zip), `stripe login`, then `stripe listen --forward-to localhost:3000/api/webhooks/stripe --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted`. Put the printed `whsec_…` in `.env` (it differs from the dashboard endpoint's secret).
7. **Emails** (optional): Settings → Customer emails → enable receipts and failed-payment emails, so the app doesn't need to send its own.

---

## 7. Testing Checklist

### Automated

- [ ] `npm test` — new `usage`, `billing`, `validations/billing` tests and the extended action tests pass
- [ ] `npm run lint` and `npm run build` pass

### Manual (dev server + `stripe listen`, a **newly registered free user**, since the demo user is seeded Pro)

**Checkout and webhooks**
- [ ] Settings shows Free, usage `n / 50` and `n / 3`, and both upgrade buttons
- [ ] Monthly upgrade with `4242 4242 4242 4242` → back on `/settings?upgraded=1`, toast, card shows Pro, URL cleaned
- [ ] DB (development branch): `isPro = true`, `stripeCustomerId` and `stripeSubscriptionId` set
- [ ] Yearly upgrade works the same (on another new user)
- [ ] Cancel on the Checkout page → back on `/settings`, still Free, no subscription
- [ ] Declined card `4000 0000 0000 0002` → error shown on Checkout, user stays Free
- [ ] 3DS card `4000 0000 0000 3220` → completes after authentication
- [ ] Upgrade POST from an already-Pro user → 409 "You're already on Pro."
- [ ] Bad plan (`{ "plan": "price_123" }`) → 400; signed out → 401
- [ ] Webhook with a bad/missing signature → 400; replaying the same event is harmless

**Portal and downgrade**
- [ ] Pro user → Manage billing → portal → returns to `/settings`
- [ ] Switch monthly → yearly in the portal → still Pro, same subscription ID
- [ ] Cancel at period end → still Pro (`status` stays `active`)
- [ ] Cancel immediately (Dashboard or `stripe subscriptions cancel sub_…`) → `isPro = false`, `stripeSubscriptionId` null, customer ID kept; reload shows Free
- [ ] Failed renewal (test clock or `stripe trigger invoice.payment_failed`) → `past_due` keeps Pro; final failure → `unpaid`/`canceled` removes it
- [ ] Former subscriber sees Manage billing for invoices and can re-upgrade with the same customer

**Gating**
- [ ] Free user at 50 items → New Item fails with the limit toast; deleting one allows creating again
- [ ] Free user at 3 collections → New Collection fails with the limit toast
- [ ] Free user creating a File item → error toast; `POST /api/upload` with `type=file` → 403; no object left in R2 `pending/`
- [ ] Images: behave per the decision (allowed for free, or 403)
- [ ] Pro user: >50 items, >3 collections, file uploads all work
- [ ] Downgraded user above the limits can still view, edit, download and delete existing items and files
- [ ] Session sync: flip `isPro` via webhook → next page load reflects it without signing out

**Account deletion**
- [ ] Deleting a Pro account cancels the Stripe subscription (check the Dashboard), and the resulting `subscription.deleted` webhook is a harmless no-op

**UI**
- [ ] Billing card at 390px, no horizontal scroll; spinners and disabled states during requests; 429 shows the rate-limit toast

---

## 8. Implementation Order

Matches the two existing phase specs, with the fixes above folded in.

**Phase 1 — infrastructure (no UI)**
1. Dashboard setup (test mode), env vars in `.env`
2. `npm install stripe`; `src/lib/stripe.ts`
3. `src/lib/usage.ts` + tests; point `isProSystemType` at `isProOnlyItemType` (after the images decision)
4. Session: `next-auth.d.ts`, `auth.ts` `jwt` select, `auth.config.ts` session callback, `getCurrentUser()`
5. `src/lib/validations/billing.ts`, `src/lib/billing.ts` (checkout, portal, sync, event handler) + tests
6. `billing` rate limiter; checkout and portal routes; verify with curl (signed-in cookie)

**Phase 2 — webhooks, gating, UI**
7. Webhook route; verify with `stripe listen` + a real test checkout (prefer a real checkout over `stripe trigger checkout.session.completed`, whose fixture customer won't match any user)
8. Gating in `createItem`, `createCollection` and `/api/upload` + action tests
9. Cancel the subscription on account deletion + test
10. `BillingSettings`, `UpgradeToast`, settings page wiring; homepage Pro CTA → `/settings#billing`
11. Optional: Pro hints in `TypeSelector` / New Collection for free users
12. Update `context/project-overview.md` (env name, roadmap, images decision); full manual checklist; `npm test`, lint, build
13. Before going live: Live-mode product/prices/portal, production webhook endpoint and secrets in Vercel

---

## Deviations from the phase specs

| Phase spec says | This plan | Why |
| --- | --- | --- |
| Make the `jwt` callback async and add an `isPro` query | Add `isPro` to the **existing** query | The callback already queries the user on every call for `sessionVersion` |
| Upload route should query `isPro` from the DB because the session may lack it | Use `getCurrentUser()` | `auth()` runs the `jwt` callback, which re-reads `isPro` every request |
| Handle `invoice.paid` / `invoice.payment_failed` | Handle `customer.subscription.*` + `checkout.session.completed`, re-fetching the subscription | Subscription status already reflects renewals and failures; `invoice.subscription` moved in the current API; re-fetching makes out-of-order events safe |
| `isPro` only for `active`/`trialing` | Also `past_due` | Otherwise the first failed retry downgrades, contradicting "don't downgrade on payment failure" |
| Gate files **and images** | Files only (pending decision) | Project overview and pricing page promise images on Free |
| `billing-settings.tsx` | `BillingSettings.tsx` | Coding standards: PascalCase components |
| `/settings?upgraded=true` + `useSearchParams` | `?upgraded=1` read from page `searchParams` | Matches existing `?registered=1` / `?reset=1` style; no Suspense boundary |
| `new Stripe(key, { typescript: true })` at module scope | Lazy `stripe()` | Option is obsolete; lazy init doesn't throw at import time in tests/build |
| — | Refuse checkout for Pro users; cancel subscription on account delete; rate-limit billing routes | Prevent double subscriptions and billing deleted users |

## Open Questions

1. **Images Pro or Free?** (blocks step 3)
2. **Trial?** None planned; add `subscription_data.trial_period_days` later if wanted (status `trialing` already counts as Pro).
3. **Over-limit after downgrade**: block only new creates (current spec), or also block editing? Plan assumes only creates.
4. **Demo user**: keep it seeded as Pro, or make it free so the demo shows the free tier?
