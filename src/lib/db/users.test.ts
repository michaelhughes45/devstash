import { describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import {
  getBillingStatus,
  getEditorPreferences,
  updateEditorPreferences,
} from "@/lib/db/users";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/editor-preferences";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const custom = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: false,
  minimap: true,
  theme: "github-dark",
} as const;

describe("getEditorPreferences", () => {
  it("returns the user's stored preferences", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ editorPreferences: custom } as never);

    expect(await getEditorPreferences("user-1")).toEqual(custom);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { editorPreferences: true },
    });
  });

  it("returns the defaults when nothing is saved", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ editorPreferences: null } as never);

    expect(await getEditorPreferences("user-1")).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns the defaults when the user is gone", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    expect(await getEditorPreferences("user-1")).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });
});

describe("updateEditorPreferences", () => {
  it("saves the preferences on the user", async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({ editorPreferences: custom } as never);

    expect(await updateEditorPreferences("user-1", custom)).toEqual(custom);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { editorPreferences: custom },
      select: { editorPreferences: true },
    });
  });

  it("returns null when the user no longer exists", async () => {
    vi.mocked(prisma.user.update).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "test",
      }),
    );

    expect(await updateEditorPreferences("user-1", custom)).toBeNull();
  });

  it("rethrows other errors", async () => {
    vi.mocked(prisma.user.update).mockRejectedValue(new Error("connection lost"));

    await expect(updateEditorPreferences("user-1", custom)).rejects.toThrow("connection lost");
  });
});

describe("getBillingStatus", () => {
  it("reports Pro and a billing account without returning Stripe IDs", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      isPro: true,
      stripeCustomerId: "cus_123",
    } as never);

    const status = await getBillingStatus("user-1");

    expect(status).toEqual({ isPro: true, hasBillingAccount: true });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { isPro: true, stripeCustomerId: true },
    });
  });

  it("reports no billing account for a user who never checked out", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      isPro: false,
      stripeCustomerId: null,
    } as never);

    expect(await getBillingStatus("user-1")).toEqual({ isPro: false, hasBillingAccount: false });
  });

  it("returns null when the user no longer exists", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    expect(await getBillingStatus("user-1")).toBeNull();
  });
});
