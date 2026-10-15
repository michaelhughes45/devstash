import { describe, expect, it, vi } from "vitest";

import { isProSystemType } from "@/lib/item-type-names";
import { prisma } from "@/lib/prisma";
import {
  canCreateCollection,
  canCreateItem,
  FREE_COLLECTION_LIMIT,
  FREE_ITEM_LIMIT,
  getUserUsage,
  isProOnlyItemType,
} from "@/lib/usage-limits";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { count: vi.fn() },
    collection: { count: vi.fn() },
  },
}));

function mockCounts(items: number, collections: number) {
  vi.mocked(prisma.item.count).mockResolvedValue(items);
  vi.mocked(prisma.collection.count).mockResolvedValue(collections);
}

describe("getUserUsage", () => {
  it("returns both counts, scoped to the user, with the create flags", async () => {
    mockCounts(12, 2);

    expect(await getUserUsage("user-1", false)).toEqual({
      itemCount: 12,
      collectionCount: 2,
      canCreateItem: true,
      canCreateCollection: true,
    });
    expect(prisma.item.count).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(prisma.collection.count).toHaveBeenCalledWith({ where: { userId: "user-1" } });
  });

  it("blocks a free user at the limits", async () => {
    mockCounts(FREE_ITEM_LIMIT, FREE_COLLECTION_LIMIT);

    expect(await getUserUsage("user-1", false)).toMatchObject({
      canCreateItem: false,
      canCreateCollection: false,
    });
  });

  it("allows a Pro user above the limits", async () => {
    mockCounts(120, 10);

    expect(await getUserUsage("user-1", true)).toEqual({
      itemCount: 120,
      collectionCount: 10,
      canCreateItem: true,
      canCreateCollection: true,
    });
  });
});

describe("canCreateItem", () => {
  it("allows a free user below 50 items and blocks at exactly 50 and above", async () => {
    vi.mocked(prisma.item.count).mockResolvedValueOnce(49);
    expect(await canCreateItem("user-1", false)).toBe(true);

    vi.mocked(prisma.item.count).mockResolvedValueOnce(50);
    expect(await canCreateItem("user-1", false)).toBe(false);

    vi.mocked(prisma.item.count).mockResolvedValueOnce(51);
    expect(await canCreateItem("user-1", false)).toBe(false);

    expect(prisma.item.count).toHaveBeenCalledWith({ where: { userId: "user-1" } });
  });

  it("allows a Pro user without querying", async () => {
    expect(await canCreateItem("user-1", true)).toBe(true);
    expect(prisma.item.count).not.toHaveBeenCalled();
  });
});

describe("canCreateCollection", () => {
  it("allows a free user below 3 collections and blocks at exactly 3 and above", async () => {
    vi.mocked(prisma.collection.count).mockResolvedValueOnce(2);
    expect(await canCreateCollection("user-1", false)).toBe(true);

    vi.mocked(prisma.collection.count).mockResolvedValueOnce(3);
    expect(await canCreateCollection("user-1", false)).toBe(false);

    vi.mocked(prisma.collection.count).mockResolvedValueOnce(4);
    expect(await canCreateCollection("user-1", false)).toBe(false);

    expect(prisma.collection.count).toHaveBeenCalledWith({ where: { userId: "user-1" } });
  });

  it("allows a Pro user without querying", async () => {
    expect(await canCreateCollection("user-1", true)).toBe(true);
    expect(prisma.collection.count).not.toHaveBeenCalled();
  });
});

describe("isProOnlyItemType", () => {
  it("is true for file and image only", () => {
    expect(isProOnlyItemType("file")).toBe(true);
    expect(isProOnlyItemType("image")).toBe(true);
    expect(isProOnlyItemType("snippet")).toBe(false);
    expect(isProOnlyItemType("link")).toBe(false);
    expect(isProOnlyItemType("recipe")).toBe(false);
  });

  it("drives the sidebar PRO badge for system types", () => {
    for (const type of ["file", "image", "snippet", "link"]) {
      expect(isProSystemType(type, true)).toBe(isProOnlyItemType(type));
    }
  });
});
