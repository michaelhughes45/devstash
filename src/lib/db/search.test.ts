import { describe, expect, it, vi } from "vitest";

import { getAllCollections } from "@/lib/db/collections";
import { getSearchData, getSearchItems, SEARCH_ITEM_LIMIT } from "@/lib/db/search";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: vi.fn() },
}));

vi.mock("@/lib/db/collections", () => ({
  getAllCollections: vi.fn(),
}));

const snippetRow = {
  id: "item-1",
  title: "useDebounce hook",
  previewSource: "export function useDebounce(\n  value,\n  delay\n) {",
  typeId: "t-snippet",
  typeName: "snippet",
  typeIcon: "Code",
  typeColor: "#3b82f6",
};

describe("getSearchItems", () => {
  it("queries only the user's items, newest edits first, up to the limit", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

    await getSearchItems("user-1");

    const [strings, ...values] = vi.mocked(prisma.$queryRaw).mock.calls[0] as unknown as [
      TemplateStringsArray,
      ...unknown[],
    ];
    const sql = strings.join("?");
    expect(sql).toContain(`WHERE i."userId" = ?`);
    expect(sql).toContain(`ORDER BY i."updatedAt" DESC`);
    // Only the start of the text is read from the database
    expect(sql).toMatch(/LEFT\(COALESCE\(i\."content", i\."url", i\."fileName", i\."description"\)/);
    expect(values).toContain("user-1");
    expect(values).toContain(SEARCH_ITEM_LIMIT);
  });

  it("returns a one-line preview and the type, with default icon and color", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      snippetRow,
      { ...snippetRow, id: "item-2", previewSource: null, typeIcon: null, typeColor: null },
    ]);

    expect(await getSearchItems("user-1")).toEqual([
      {
        id: "item-1",
        title: "useDebounce hook",
        preview: "export function useDebounce( value, delay ) {",
        type: { id: "t-snippet", name: "snippet", icon: "Code", color: "#3b82f6" },
      },
      {
        id: "item-2",
        title: "useDebounce hook",
        preview: "",
        type: { id: "t-snippet", name: "snippet", icon: "File", color: "#6b7280" },
      },
    ]);
  });
});

describe("getSearchData", () => {
  it("combines the items with each collection's id, name and item count", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([snippetRow]);
    vi.mocked(getAllCollections).mockResolvedValue([
      {
        id: "col-1",
        name: "React Patterns",
        description: "Hooks and components",
        isFavorite: true,
        itemCount: 3,
        types: [],
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const data = await getSearchData("user-1");

    expect(getAllCollections).toHaveBeenCalledWith("user-1");
    expect(data.items.map((item) => item.id)).toEqual(["item-1"]);
    expect(data.collections).toEqual([{ id: "col-1", name: "React Patterns", itemCount: 3 }]);
  });
});
