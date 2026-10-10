import { describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import {
  createItem,
  deleteItem,
  getItemDetail,
  getItemFile,
  getFavoriteItems,
  getItemKind,
  getItemsByCollection,
  getItemsByType,
  setItemFavorite,
  updateItem,
} from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    itemType: { findFirst: vi.fn() },
    itemCollection: { findMany: vi.fn(), count: vi.fn() },
  },
}));

const createdAt = new Date("2026-01-15T10:00:00Z");
const updatedAt = new Date("2026-02-01T12:00:00Z");

const row = {
  id: "item-1",
  title: "useAuth Hook",
  description: "Custom authentication hook",
  isFavorite: true,
  isPinned: false,
  createdAt,
  updatedAt,
  contentType: "TEXT",
  content: "export function useAuth() {}",
  language: "typescript",
  url: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  type: { id: "type-1", name: "snippet", icon: null, color: null },
  tags: [{ tag: { name: "react" } }, { tag: { name: "auth" } }],
  collections: [{ collection: { id: "col-1", name: "React Patterns" } }],
};

describe("getItemDetail", () => {
  it("only looks up the item for its owner", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

    await getItemDetail("user-1", "item-1");

    expect(prisma.item.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "item-1", userId: "user-1" } }),
    );
  });

  it("returns null when the item is missing or belongs to someone else", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

    expect(await getItemDetail("user-1", "item-1")).toBeNull();
  });

  it("flattens tags and collections and fills in type defaults", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(row as never);

    expect(await getItemDetail("user-1", "item-1")).toEqual({
      id: "item-1",
      title: "useAuth Hook",
      description: "Custom authentication hook",
      isFavorite: true,
      isPinned: false,
      createdAt,
      updatedAt,
      contentType: "TEXT",
      content: "export function useAuth() {}",
      language: "typescript",
      url: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      type: { id: "type-1", name: "snippet", icon: "File", color: "#6b7280" },
      tags: ["react", "auth"],
      collections: [{ id: "col-1", name: "React Patterns" }],
    });
  });
});

describe("getFavoriteItems", () => {
  it("lists only the user's favorites, most recently updated first, without text content", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([]);

    await getFavoriteItems("user-1");

    const query = vi.mocked(prisma.item.findMany).mock.calls[0][0] as {
      where: unknown;
      orderBy: unknown;
      select: Record<string, unknown>;
    };
    expect(query.where).toEqual({ userId: "user-1", isFavorite: true });
    expect(query.orderBy).toEqual([{ updatedAt: "desc" }, { id: "desc" }]);
    expect(query.select).not.toHaveProperty("content");
    expect(query.select).toMatchObject({ updatedAt: true, title: true });
  });

  it("keeps updatedAt and fills in type defaults", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([row] as never);

    const [item] = await getFavoriteItems("user-1");

    expect(item).toMatchObject({
      id: "item-1",
      updatedAt,
      type: { id: "type-1", name: "snippet", icon: "File", color: "#6b7280" },
      tags: ["react", "auth"],
    });
  });
});

describe("getItemsByType", () => {
  it("leaves text content out of the card query", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([]);
    vi.mocked(prisma.item.count).mockResolvedValue(0);

    await getItemsByType("user-1", "type-1", { skip: 0, take: 21 });

    const { select } = vi.mocked(prisma.item.findMany).mock.calls[0][0] as {
      select: Record<string, unknown>;
    };
    expect(select).not.toHaveProperty("content");
    expect(select).toMatchObject({ contentType: true, url: true, fileUrl: true });
  });

  it("fetches only the requested page, newest first, and counts every match", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([row] as never);
    vi.mocked(prisma.item.count).mockResolvedValue(45);

    const page = await getItemsByType("user-1", "type-1", { skip: 21, take: 21 });

    expect(prisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", typeId: "type-1" },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: 21,
        take: 21,
      }),
    );
    expect(prisma.item.count).toHaveBeenCalledWith({
      where: { userId: "user-1", typeId: "type-1" },
    });
    expect(page.total).toBe(45);
    expect(page.rows.map((item) => item.id)).toEqual(["item-1"]);
  });
});

describe("getItemsByCollection", () => {
  it("fetches one page of the user's items in the collection, most recently added first", async () => {
    vi.mocked(prisma.itemCollection.findMany).mockResolvedValue([]);
    vi.mocked(prisma.itemCollection.count).mockResolvedValue(30);

    const page = await getItemsByCollection("user-1", "col-1", { skip: 21, take: 21 });

    const where = { collectionId: "col-1", item: { userId: "user-1" } };
    expect(prisma.itemCollection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where,
        orderBy: [{ addedAt: "desc" }, { itemId: "desc" }],
        skip: 21,
        take: 21,
      }),
    );
    expect(prisma.itemCollection.count).toHaveBeenCalledWith({ where });
    expect(page).toEqual({ rows: [], total: 30 });
  });

  it("maps the linked items to cards and leaves text content out of the query", async () => {
    vi.mocked(prisma.itemCollection.findMany).mockResolvedValue([{ item: row }] as never);
    vi.mocked(prisma.itemCollection.count).mockResolvedValue(1);

    const {
      rows: [item],
    } = await getItemsByCollection("user-1", "col-1", { skip: 0, take: 21 });

    expect(item).toMatchObject({
      id: "item-1",
      type: { id: "type-1", name: "snippet", icon: "File", color: "#6b7280" },
      tags: ["react", "auth"],
    });
    const { select } = vi.mocked(prisma.itemCollection.findMany).mock.calls[0][0] as {
      select: { item: { select: Record<string, unknown> } };
    };
    expect(select.item.select).not.toHaveProperty("content");
  });
});

describe("getItemKind", () => {
  it("looks up the owner's item content type and type name", async () => {
    const kind = { contentType: "URL", type: { name: "link" } };
    vi.mocked(prisma.item.findFirst).mockResolvedValue(kind as never);

    expect(await getItemKind("user-1", "item-1")).toEqual(kind);
    expect(prisma.item.findFirst).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      select: { contentType: true, type: { select: { name: true } } },
    });
  });

  it("returns null when the item is missing or belongs to someone else", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

    expect(await getItemKind("user-1", "item-1")).toBeNull();
  });
});

describe("createItem", () => {
  const data = {
    type: "snippet" as const,
    title: "useAuth Hook",
    description: null,
    content: "export function useAuth() {}",
    language: "typescript",
    url: null,
    tags: ["react", "hooks"],
    collectionIds: [],
  };

  it("looks up the system type by name", async () => {
    vi.mocked(prisma.itemType.findFirst).mockResolvedValue(null);

    await createItem("user-1", data);

    expect(prisma.itemType.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: "snippet", isSystem: true, userId: null } }),
    );
  });

  it("returns null without creating anything when the type is missing", async () => {
    vi.mocked(prisma.itemType.findFirst).mockResolvedValue(null);

    expect(await createItem("user-1", data)).toBeNull();
    expect(prisma.item.create).not.toHaveBeenCalled();
  });

  it("creates the item for the user with its type, content type and tags", async () => {
    vi.mocked(prisma.itemType.findFirst).mockResolvedValue({ id: "type-1" } as never);
    vi.mocked(prisma.item.create).mockResolvedValue(row as never);

    await createItem("user-1", data);

    expect(prisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          title: "useAuth Hook",
          description: null,
          content: "export function useAuth() {}",
          language: "typescript",
          url: null,
          contentType: "TEXT",
          userId: "user-1",
          typeId: "type-1",
          tags: {
            create: ["react", "hooks"].map((name) => ({
              tag: {
                connectOrCreate: {
                  where: { userId_name: { userId: "user-1", name } },
                  create: { userId: "user-1", name },
                },
              },
            })),
          },
          collections: { create: [] },
        },
      }),
    );
  });

  it("links the item to the given collections", async () => {
    vi.mocked(prisma.itemType.findFirst).mockResolvedValue({ id: "type-1" } as never);
    vi.mocked(prisma.item.create).mockResolvedValue(row as never);

    await createItem("user-1", { ...data, collectionIds: ["col-1", "col-2"] });

    expect(prisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collections: { create: [{ collectionId: "col-1" }, { collectionId: "col-2" }] },
        }),
      }),
    );
  });

  it("stores links with the URL content type", async () => {
    vi.mocked(prisma.itemType.findFirst).mockResolvedValue({ id: "type-7" } as never);
    vi.mocked(prisma.item.create).mockResolvedValue(row as never);

    await createItem("user-1", {
      ...data,
      type: "link",
      content: null,
      language: null,
      url: "https://nextjs.org",
      tags: [],
    });

    expect(prisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ contentType: "URL", url: "https://nextjs.org" }),
      }),
    );
  });

  it("stores file and image items with the FILE content type and file details", async () => {
    vi.mocked(prisma.itemType.findFirst).mockResolvedValue({ id: "type-5" } as never);
    vi.mocked(prisma.item.create).mockResolvedValue(row as never);
    const file = {
      fileUrl: "https://files.example.com/user1/abc.png",
      fileName: "diagram.png",
      fileSize: 1234,
    };

    await createItem(
      "user-1",
      { ...data, type: "image", content: null, language: null, tags: [] },
      file,
    );

    expect(prisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ contentType: "FILE", ...file }),
      }),
    );
  });

  it("returns the created item detail", async () => {
    vi.mocked(prisma.itemType.findFirst).mockResolvedValue({ id: "type-1" } as never);
    vi.mocked(prisma.item.create).mockResolvedValue(row as never);

    const item = await createItem("user-1", data);

    expect(item?.tags).toEqual(["react", "auth"]);
    expect(item?.type).toEqual({ id: "type-1", name: "snippet", icon: "File", color: "#6b7280" });
  });
});

describe("updateItem", () => {
  const data = {
    title: "useAuth Hook",
    description: null,
    content: "export function useAuth() {}",
    tags: ["react", "hooks"],
  };

  it("updates only the owner's item and replaces its tags", async () => {
    vi.mocked(prisma.item.update).mockResolvedValue(row as never);

    await updateItem("user-1", "item-1", data);

    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "item-1", userId: "user-1" },
        data: {
          title: "useAuth Hook",
          description: null,
          content: "export function useAuth() {}",
          tags: {
            deleteMany: {},
            create: ["react", "hooks"].map((name) => ({
              tag: {
                connectOrCreate: {
                  where: { userId_name: { userId: "user-1", name } },
                  create: { userId: "user-1", name },
                },
              },
            })),
          },
        },
      }),
    );
  });

  it("replaces the item's collections, keeping the ones that stay", async () => {
    vi.mocked(prisma.item.update).mockResolvedValue(row as never);

    await updateItem("user-1", "item-1", { ...data, collectionIds: ["col-1", "col-2"] });

    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collections: {
            deleteMany: { collectionId: { notIn: ["col-1", "col-2"] } },
            connectOrCreate: ["col-1", "col-2"].map((collectionId) => ({
              where: { itemId_collectionId: { itemId: "item-1", collectionId } },
              create: { collectionId },
            })),
          },
        }),
      }),
    );
  });

  it("removes every collection link for an empty list", async () => {
    vi.mocked(prisma.item.update).mockResolvedValue(row as never);

    await updateItem("user-1", "item-1", { ...data, collectionIds: [] });

    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collections: { deleteMany: { collectionId: { notIn: [] } }, connectOrCreate: [] },
        }),
      }),
    );
  });

  it("returns the updated item detail", async () => {
    vi.mocked(prisma.item.update).mockResolvedValue(row as never);

    const item = await updateItem("user-1", "item-1", data);

    expect(item?.tags).toEqual(["react", "auth"]);
    expect(item?.collections).toEqual([{ id: "col-1", name: "React Patterns" }]);
  });

  it("returns null when the item is missing or belongs to someone else", async () => {
    vi.mocked(prisma.item.update).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("No record found", {
        code: "P2025",
        clientVersion: "test",
      }),
    );

    expect(await updateItem("user-1", "item-1", data)).toBeNull();
  });

  it("rethrows other database errors", async () => {
    vi.mocked(prisma.item.update).mockRejectedValue(new Error("db down"));

    await expect(updateItem("user-1", "item-1", data)).rejects.toThrow("db down");
  });
});

describe("deleteItem", () => {
  it("only deletes the item for its owner", async () => {
    vi.mocked(prisma.item.delete).mockResolvedValue({ fileUrl: null } as never);

    expect(await deleteItem("user-1", "item-1")).toEqual({ fileUrl: null });
    expect(prisma.item.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "item-1", userId: "user-1" } }),
    );
  });

  it("returns false for a missing or someone else's item", async () => {
    vi.mocked(prisma.item.delete).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("No record found", {
        code: "P2025",
        clientVersion: "test",
      }),
    );

    expect(await deleteItem("user-1", "item-1")).toBeNull();
  });

  it("rethrows other database errors", async () => {
    vi.mocked(prisma.item.delete).mockRejectedValue(new Error("db down"));

    await expect(deleteItem("user-1", "item-1")).rejects.toThrow("db down");
  });
});

describe("getItemFile", () => {
  it("only looks up the owner's file items", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

    expect(await getItemFile("user-1", "item-1")).toBeNull();
    expect(prisma.item.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "item-1", userId: "user-1", contentType: "FILE", fileUrl: { not: null } },
      }),
    );
  });

  it("returns the stored file URL and name", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue({
      fileUrl: "https://files.example.com/a.pdf",
      fileName: "a.pdf",
    } as never);

    expect(await getItemFile("user-1", "item-1")).toEqual({
      fileUrl: "https://files.example.com/a.pdf",
      fileName: "a.pdf",
    });
  });
});

describe("setItemFavorite", () => {
  it("sets the flag on the owner's item only", async () => {
    vi.mocked(prisma.item.update).mockResolvedValue({ isFavorite: true } as never);

    expect(await setItemFavorite("user-1", "item-1", true)).toBe(true);
    expect(prisma.item.update).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      data: { isFavorite: true },
      select: { isFavorite: true },
    });
  });

  it("returns null for a missing or someone else's item", async () => {
    vi.mocked(prisma.item.update).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("No record found", {
        code: "P2025",
        clientVersion: "test",
      }),
    );

    expect(await setItemFavorite("user-2", "item-1", false)).toBeNull();
  });

  it("rethrows other database errors", async () => {
    vi.mocked(prisma.item.update).mockRejectedValue(new Error("db down"));

    await expect(setItemFavorite("user-1", "item-1", true)).rejects.toThrow("db down");
  });
});
