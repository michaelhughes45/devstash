import { describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import {
  createCollection,
  deleteCollection,
  getCollection,
  getCollectionOptions,
  getCollectionsPage,
  ownsCollections,
  updateCollection,
} from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
    collection: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
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

describe("getCollectionsPage", () => {
  const usedAt = new Date("2026-03-01T00:00:00Z");
  const card = (id: string, name: string) => ({
    id,
    name,
    description: null,
    isFavorite: false,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    _count: { items: 2 },
  });

  it("orders and pages in the database, then loads only that page's collections", async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ id: "col-2" }, { id: "col-1" }])
      .mockResolvedValueOnce([
        {
          collectionId: "col-2",
          typeId: "type-1",
          typeName: "snippet",
          typeIcon: null,
          typeColor: "#3b82f6",
          lastUsedAt: usedAt,
        },
      ]);
    vi.mocked(prisma.collection.count).mockResolvedValue(23);
    // Returned out of order, as `id IN (...)` doesn't keep the page's order
    vi.mocked(prisma.collection.findMany).mockResolvedValue([
      card("col-1", "DevOps"),
      card("col-2", "React Patterns"),
    ] as never);

    const page = await getCollectionsPage("user-1", { skip: 21, take: 21 });

    const [, ...pageValues] = vi.mocked(prisma.$queryRaw).mock.calls[0] as unknown[];
    expect(pageValues).toEqual(["user-1", 21, 21]);
    expect(prisma.collection.count).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(prisma.collection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1", id: { in: ["col-2", "col-1"] } } }),
    );
    expect(page.total).toBe(23);
    expect(page.rows.map((collection) => collection.id)).toEqual(["col-2", "col-1"]);
    expect(page.rows[0]).toMatchObject({
      itemCount: 2,
      lastUsedAt: usedAt,
      types: [{ id: "type-1", name: "snippet", icon: "File", color: "#3b82f6" }],
    });
    expect(page.rows[1].types).toEqual([]);
  });

  it("skips loading collections for a page past the end", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);
    vi.mocked(prisma.collection.count).mockResolvedValue(3);

    expect(await getCollectionsPage("user-1", { skip: 21, take: 21 })).toEqual({
      rows: [],
      total: 3,
    });
    expect(prisma.collection.findMany).not.toHaveBeenCalled();
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

function notFoundError() {
  return new Prisma.PrismaClientKnownRequestError("No record found", {
    code: "P2025",
    clientVersion: "test",
  });
}

describe("updateCollection", () => {
  it("updates only the owner's collection", async () => {
    const updated = { id: "col-1", name: "DevOps", description: "CI", isFavorite: false };
    vi.mocked(prisma.collection.update).mockResolvedValue(updated as never);

    const result = await updateCollection("user-1", "col-1", { name: "DevOps", description: "CI" });

    expect(result).toEqual(updated);
    expect(prisma.collection.update).toHaveBeenCalledWith({
      where: { id: "col-1", userId: "user-1" },
      data: { name: "DevOps", description: "CI" },
      select: { id: true, name: true, description: true, isFavorite: true },
    });
  });

  it("returns null for a missing or someone else's collection", async () => {
    vi.mocked(prisma.collection.update).mockRejectedValue(notFoundError());

    expect(await updateCollection("user-2", "col-1", { name: "A", description: null })).toBeNull();
  });

  it("rethrows other errors", async () => {
    vi.mocked(prisma.collection.update).mockRejectedValue(new Error("db down"));

    await expect(
      updateCollection("user-1", "col-1", { name: "A", description: null }),
    ).rejects.toThrow("db down");
  });
});

describe("deleteCollection", () => {
  it("deletes only the owner's collection", async () => {
    vi.mocked(prisma.collection.delete).mockResolvedValue({ id: "col-1" } as never);

    expect(await deleteCollection("user-1", "col-1")).toBe(true);
    expect(prisma.collection.delete).toHaveBeenCalledWith({
      where: { id: "col-1", userId: "user-1" },
      select: { id: true },
    });
  });

  it("returns false for a missing or someone else's collection", async () => {
    vi.mocked(prisma.collection.delete).mockRejectedValue(notFoundError());

    expect(await deleteCollection("user-2", "col-1")).toBe(false);
  });
});
