import { describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import {
  createItem,
  deleteItem,
  getCreatableItemTypes,
  getItemDetail,
  getItemFile,
  getItemsByType,
  isUniqueViolation,
  updateItem,
} from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    itemType: { findFirst: vi.fn(), findMany: vi.fn() },
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

describe("getItemsByType", () => {
  it("leaves text content out of the card query", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([]);

    await getItemsByType("user-1", "type-1");

    const { select } = vi.mocked(prisma.item.findMany).mock.calls[0][0] as {
      select: Record<string, unknown>;
    };
    expect(select).not.toHaveProperty("content");
    expect(select).toMatchObject({ contentType: true, url: true, fileUrl: true });
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
        },
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

describe("getCreatableItemTypes", () => {
  it("returns the seeded system types in dialog order with labels", async () => {
    vi.mocked(prisma.itemType.findMany).mockResolvedValue([
      { name: "link", icon: "Link", color: "#10b981" },
      { name: "snippet", icon: "Code", color: "#3b82f6" },
      { name: "note", icon: null, color: null },
    ] as never);

    expect(await getCreatableItemTypes()).toEqual([
      { name: "snippet", label: "Snippet", icon: "Code", color: "#3b82f6" },
      { name: "note", label: "Note", icon: "File", color: "#6b7280" },
      { name: "link", label: "Link", icon: "Link", color: "#10b981" },
    ]);
    expect(prisma.itemType.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isSystem: true,
          userId: null,
          name: { in: ["snippet", "prompt", "command", "note", "file", "image", "link"] },
        },
      }),
    );
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

describe("isUniqueViolation", () => {
  it("is true only for Prisma's unique constraint error", () => {
    const error = (code: string) =>
      new Prisma.PrismaClientKnownRequestError("failed", { code, clientVersion: "test" });

    expect(isUniqueViolation(error("P2002"))).toBe(true);
    expect(isUniqueViolation(error("P2025"))).toBe(false);
    expect(isUniqueViolation(new Error("P2002"))).toBe(false);
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
