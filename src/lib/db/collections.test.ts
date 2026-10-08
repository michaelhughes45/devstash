import { describe, expect, it, vi } from "vitest";

import {
  createCollection,
  getCollection,
  getCollectionOptions,
  ownsCollections,
} from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: { collection: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() } },
}));

describe("getCollection", () => {
  it("only looks up the collection for its owner", async () => {
    const collection = { id: "col-1", name: "DevOps", description: null, isFavorite: true };
    vi.mocked(prisma.collection.findFirst).mockResolvedValue(collection as never);

    expect(await getCollection("user-1", "col-1")).toEqual(collection);
    expect(prisma.collection.findFirst).toHaveBeenCalledWith({
      where: { id: "col-1", userId: "user-1" },
      select: { id: true, name: true, description: true, isFavorite: true },
    });
  });

  it("returns null when the collection is missing or someone else's", async () => {
    vi.mocked(prisma.collection.findFirst).mockResolvedValue(null);

    expect(await getCollection("user-2", "col-1")).toBeNull();
  });
});

describe("getCollectionOptions", () => {
  it("lists only the user's collections by name", async () => {
    const options = [{ id: "col-2", name: "AI Workflows" }];
    vi.mocked(prisma.collection.findMany).mockResolvedValue(options as never);

    expect(await getCollectionOptions("user-1")).toEqual(options);
    expect(prisma.collection.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  });
});

describe("ownsCollections", () => {
  it("is true without a query for an empty list", async () => {
    expect(await ownsCollections("user-1", [])).toBe(true);
    expect(prisma.collection.count).not.toHaveBeenCalled();
  });

  it("is true when every collection belongs to the user", async () => {
    vi.mocked(prisma.collection.count).mockResolvedValue(2);

    expect(await ownsCollections("user-1", ["col-1", "col-2"])).toBe(true);
    expect(prisma.collection.count).toHaveBeenCalledWith({
      where: { userId: "user-1", id: { in: ["col-1", "col-2"] } },
    });
  });

  it("is false when any collection is missing or someone else's", async () => {
    vi.mocked(prisma.collection.count).mockResolvedValue(1);

    expect(await ownsCollections("user-1", ["col-1", "other-users"])).toBe(false);
  });
});

describe("createCollection", () => {
  it("creates the collection for the given user", async () => {
    const created = {
      id: "col-1",
      name: "React Patterns",
      description: null,
      createdAt: new Date("2026-10-08T10:00:00Z"),
    };
    vi.mocked(prisma.collection.create).mockResolvedValue(created as never);

    const result = await createCollection("user-1", { name: "React Patterns", description: null });

    expect(result).toEqual(created);
    expect(prisma.collection.create).toHaveBeenCalledWith({
      data: { userId: "user-1", name: "React Patterns", description: null },
      select: { id: true, name: true, description: true, createdAt: true },
    });
  });
});
