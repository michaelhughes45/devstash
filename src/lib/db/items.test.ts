import { describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { getItemDetail, updateItem } from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: { item: { findFirst: vi.fn(), update: vi.fn() } },
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
