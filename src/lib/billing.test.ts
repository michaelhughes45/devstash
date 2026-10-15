import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cancelSubscriptionQuietly,
  createCheckoutUrl,
  createPortalUrl,
  handleStripeEvent,
  isProStatus,
  priceIdFor,
  syncSubscription,
} from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/stripe", () => ({ stripe: vi.fn() }));

const client = {
  customers: { create: vi.fn() },
  checkout: { sessions: { create: vi.fn() } },
  billingPortal: { sessions: { create: vi.fn() } },
  subscriptions: { retrieve: vi.fn(), cancel: vi.fn() },
};

const findUser = () => vi.mocked(prisma.user.findUnique);

beforeEach(() => {
  vi.stubEnv("APP_URL", "https://devstash.test");
  vi.stubEnv("STRIPE_PRICE_ID_MONTHLY", "price_monthly");
  vi.stubEnv("STRIPE_PRICE_ID_YEARLY", "price_yearly");
  vi.mocked(stripe).mockReturnValue(client as unknown as Stripe);
  for (const fn of [
    client.customers.create,
    client.checkout.sessions.create,
    client.billingPortal.sessions.create,
    client.subscriptions.retrieve,
    client.subscriptions.cancel,
  ]) {
    fn.mockReset();
  }
});

describe("priceIdFor", () => {
  it("maps each plan to its price ID from the environment", () => {
    expect(priceIdFor("monthly")).toBe("price_monthly");
    expect(priceIdFor("yearly")).toBe("price_yearly");
  });

  it("throws when the price ID isn't set", () => {
    vi.stubEnv("STRIPE_PRICE_ID_YEARLY", "");

    expect(() => priceIdFor("yearly")).toThrow("STRIPE_PRICE_ID_YEARLY is not set");
  });
});

describe("isProStatus", () => {
  it("counts active, trialing and past_due as Pro", () => {
    expect(isProStatus("active")).toBe(true);
    expect(isProStatus("trialing")).toBe(true);
    expect(isProStatus("past_due")).toBe(true);
  });

  it("doesn't count ended or unfinished subscriptions", () => {
    for (const status of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"]) {
      expect(isProStatus(status)).toBe(false);
    }
  });
});

describe("createCheckoutUrl", () => {
  beforeEach(() => {
    client.checkout.sessions.create.mockResolvedValue({ url: "https://checkout.stripe.com/c/1" });
  });

  it("returns not-found for a missing user", async () => {
    findUser().mockResolvedValueOnce(null);

    expect(await createCheckoutUrl("user-1", "monthly")).toEqual({ error: "not-found" });
    expect(client.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("refuses a user who's already Pro", async () => {
    findUser().mockResolvedValueOnce({ isPro: true } as never);

    expect(await createCheckoutUrl("user-1", "monthly")).toEqual({ error: "already-pro" });
    expect(client.customers.create).not.toHaveBeenCalled();
    expect(client.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("reuses an existing customer", async () => {
    findUser()
      .mockResolvedValueOnce({ isPro: false } as never)
      .mockResolvedValueOnce({ email: "a@b.c", name: "A", stripeCustomerId: "cus_old" } as never);

    expect(await createCheckoutUrl("user-1", "yearly")).toEqual({
      url: "https://checkout.stripe.com/c/1",
    });
    expect(client.customers.create).not.toHaveBeenCalled();
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
    expect(client.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_old",
        line_items: [{ price: "price_yearly", quantity: 1 }],
      }),
    );
  });

  it("creates a customer once and saves it only if none was saved meanwhile", async () => {
    findUser()
      .mockResolvedValueOnce({ isPro: false } as never)
      .mockResolvedValueOnce({ email: "a@b.c", name: null, stripeCustomerId: null } as never)
      .mockResolvedValueOnce({ stripeCustomerId: "cus_new" } as never);
    client.customers.create.mockResolvedValue({ id: "cus_new" });

    await createCheckoutUrl("user-1", "monthly");

    expect(client.customers.create).toHaveBeenCalledWith(
      { email: "a@b.c", name: undefined, metadata: { userId: "user-1" } },
      { idempotencyKey: "customer-user-1" },
    );
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1", stripeCustomerId: null },
      data: { stripeCustomerId: "cus_new" },
    });
    expect(client.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_new" }),
    );
  });

  it("uses the customer a concurrent request saved first", async () => {
    findUser()
      .mockResolvedValueOnce({ isPro: false } as never)
      .mockResolvedValueOnce({ email: "a@b.c", name: "A", stripeCustomerId: null } as never)
      .mockResolvedValueOnce({ stripeCustomerId: "cus_winner" } as never);
    client.customers.create.mockResolvedValue({ id: "cus_new" });

    await createCheckoutUrl("user-1", "monthly");

    expect(client.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_winner" }),
    );
  });

  it("creates a subscription session tagged with the user and URLs from APP_URL", async () => {
    findUser()
      .mockResolvedValueOnce({ isPro: false } as never)
      .mockResolvedValueOnce({ email: "a@b.c", name: "A", stripeCustomerId: "cus_old" } as never);

    await createCheckoutUrl("user-1", "monthly");

    expect(client.checkout.sessions.create).toHaveBeenCalledWith({
      mode: "subscription",
      customer: "cus_old",
      client_reference_id: "user-1",
      line_items: [{ price: "price_monthly", quantity: 1 }],
      metadata: { userId: "user-1" },
      subscription_data: { metadata: { userId: "user-1" } },
      success_url: "https://devstash.test/settings?upgraded=1",
      cancel_url: "https://devstash.test/settings",
      allow_promotion_codes: true,
    });
  });
});

describe("createPortalUrl", () => {
  it("returns null when the user has no Stripe customer", async () => {
    findUser().mockResolvedValueOnce({ stripeCustomerId: null } as never);

    expect(await createPortalUrl("user-1")).toBeNull();
    expect(client.billingPortal.sessions.create).not.toHaveBeenCalled();
  });

  it("returns a portal URL that comes back to settings", async () => {
    findUser().mockResolvedValueOnce({ stripeCustomerId: "cus_1" } as never);
    client.billingPortal.sessions.create.mockResolvedValue({ url: "https://billing.stripe.com/p/1" });

    expect(await createPortalUrl("user-1")).toBe("https://billing.stripe.com/p/1");
    expect(client.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: "cus_1",
      return_url: "https://devstash.test/settings",
    });
  });
});

describe("syncSubscription", () => {
  const subscription = (status: string, customer: unknown = "cus_1") =>
    client.subscriptions.retrieve.mockResolvedValue({ id: "sub_1", status, customer });

  it.each(["active", "past_due"])("sets Pro and the subscription ID when %s", async (status) => {
    subscription(status);

    await syncSubscription("sub_1");

    expect(client.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { stripeCustomerId: "cus_1" },
      data: { isPro: true, stripeSubscriptionId: "sub_1" },
    });
  });

  it.each(["canceled", "unpaid"])(
    "removes Pro and the subscription ID but keeps the customer when %s",
    async (status) => {
      subscription(status);

      await syncSubscription("sub_1");

      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { stripeCustomerId: "cus_1" },
        data: { isPro: false, stripeSubscriptionId: null },
      });
    },
  );

  it("accepts an expanded customer object", async () => {
    subscription("active", { id: "cus_2", object: "customer" });

    await syncSubscription("sub_1");

    expect(prisma.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { stripeCustomerId: "cus_2" } }),
    );
  });
});

describe("handleStripeEvent", () => {
  const event = (type: string, object: object) => ({ type, data: { object } }) as Stripe.Event;

  beforeEach(() => {
    client.subscriptions.retrieve.mockResolvedValue({
      id: "sub_1",
      status: "active",
      customer: "cus_1",
    });
  });

  it("syncs the subscription from a completed subscription checkout", async () => {
    await handleStripeEvent(
      event("checkout.session.completed", { mode: "subscription", subscription: "sub_1" }),
    );

    expect(client.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
  });

  it("accepts an expanded subscription on the checkout session", async () => {
    await handleStripeEvent(
      event("checkout.session.completed", { mode: "subscription", subscription: { id: "sub_1" } }),
    );

    expect(client.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
  });

  it("ignores one-time payment checkouts", async () => {
    await handleStripeEvent(
      event("checkout.session.completed", { mode: "payment", subscription: null }),
    );

    expect(client.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ])("syncs the subscription on %s", async (type) => {
    await handleStripeEvent(event(type, { id: "sub_1" }));

    expect(client.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
    expect(prisma.user.updateMany).toHaveBeenCalled();
  });

  it("ignores other events", async () => {
    await handleStripeEvent(event("invoice.paid", { id: "in_1" }));

    expect(client.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });
});

describe("cancelSubscriptionQuietly", () => {
  it("does nothing without a subscription", async () => {
    await cancelSubscriptionQuietly(null);

    expect(client.subscriptions.cancel).not.toHaveBeenCalled();
  });

  it("cancels the subscription", async () => {
    await cancelSubscriptionQuietly("sub_1");

    expect(client.subscriptions.cancel).toHaveBeenCalledWith("sub_1");
  });

  it("logs a failed cancel instead of throwing", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    client.subscriptions.cancel.mockRejectedValue(new Error("Stripe down"));

    await expect(cancelSubscriptionQuietly("sub_1")).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalled();
  });
});
