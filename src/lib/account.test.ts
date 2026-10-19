import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteUserAccount } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

vi.mock("bcryptjs", () => ({ default: { compare: vi.fn() } }));
// The real cancelSubscriptionQuietly runs; only the Stripe client is mocked
vi.mock("@/lib/stripe", () => ({ stripe: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), deleteMany: vi.fn() },
    verificationToken: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const cancel = vi.fn();

function mockUser(stripeSubscriptionId: string | null) {
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    email: "ada@example.com",
    password: "hash",
    stripeSubscriptionId,
  } as never);
}

describe("deleteUserAccount billing", () => {
  beforeEach(() => {
    vi.mocked(stripe).mockReturnValue({ subscriptions: { cancel } } as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([]);
  });

  it("cancels the subscription before deleting the user", async () => {
    mockUser("sub_123");

    const result = await deleteUserAccount("user-1", "password");

    expect(result).toBe("deleted");
    expect(cancel).toHaveBeenCalledWith("sub_123");
    expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(prisma.$transaction).mock.invocationCallOrder[0],
    );
  });

  it("skips Stripe when there's no subscription", async () => {
    mockUser(null);

    const result = await deleteUserAccount("user-1", "password");

    expect(result).toBe("deleted");
    expect(cancel).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("still deletes the user when the cancel fails", async () => {
    mockUser("sub_123");
    cancel.mockRejectedValue(new Error("Stripe down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteUserAccount("user-1", "password");

    expect(result).toBe("deleted");
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("doesn't cancel anything when the confirmation is wrong", async () => {
    mockUser("sub_123");
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const result = await deleteUserAccount("user-1", "wrong");

    expect(result).toBe("wrong-password");
    expect(cancel).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
