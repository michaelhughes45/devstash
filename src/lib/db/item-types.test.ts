import { describe, expect, it, vi } from "vitest";

import {
  getCreatableItemTypes,
  getItemTypeBySlug,
  getItemTypesWithCounts,
} from "@/lib/db/item-types";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { groupBy: vi.fn() },
    itemType: { findMany: vi.fn() },
  },
}));

function mockTypes() {
  vi.mocked(prisma.itemType.findMany).mockResolvedValue([
    { id: "t-link", name: "link", icon: "Link", color: "#10b981", isSystem: true },
    { id: "t-custom", name: "recipe", icon: null, color: null, isSystem: false },
    { id: "t-file", name: "file", icon: "File", color: "#6b7280", isSystem: true },
    { id: "t-snippet", name: "snippet", icon: "Code", color: "#3b82f6", isSystem: true },
  ] as never);
  vi.mocked(prisma.item.groupBy).mockResolvedValue([
    { typeId: "t-snippet", _count: 4 },
    { typeId: "t-custom", _count: 1 },
  ] as never);
}

describe("getItemTypesWithCounts", () => {
  it("orders system types first, then custom types, with names, slugs and counts", async () => {
    mockTypes();

    expect(await getItemTypesWithCounts("user-1")).toEqual([
      { id: "t-snippet", name: "Snippets", slug: "snippets", icon: "Code", color: "#3b82f6", count: 4, isPro: false },
      { id: "t-file", name: "Files", slug: "files", icon: "File", color: "#6b7280", count: 0, isPro: true },
      { id: "t-link", name: "Links", slug: "links", icon: "Link", color: "#10b981", count: 0, isPro: false },
      { id: "t-custom", name: "Recipes", slug: "recipes", icon: "File", color: "#6b7280", count: 1, isPro: false },
    ]);
  });
});

describe("getItemTypeBySlug", () => {
  it("finds a type by its slug, or returns null", async () => {
    mockTypes();

    expect((await getItemTypeBySlug("user-1", "files"))?.id).toBe("t-file");
    expect(await getItemTypeBySlug("user-1", "unknown")).toBeNull();
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
