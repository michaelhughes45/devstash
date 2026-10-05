import { describe, expect, it, vi } from "vitest";

import { getItemDetail } from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: { item: { findFirst: vi.fn() } },
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
