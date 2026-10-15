import type Stripe from "stripe";

import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import type { BillingPlan } from "@/lib/validations/billing";

// past_due keeps Pro while Stripe retries the card; it ends at "canceled" or "unpaid"
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

export type CheckoutResult = { url: string } | { error: "not-found" | "already-pro" };

export async function createCheckoutUrl(
  userId: string,
  plan: BillingPlan,
): Promise<CheckoutResult> {
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

// null when the user has never started a checkout, so there's no customer to manage
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
  // The customer ID is kept either way, so a returning user reuses the same customer
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
