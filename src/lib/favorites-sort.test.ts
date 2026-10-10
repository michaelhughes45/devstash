import { describe, expect, it } from "vitest";

import { sortFavoriteCollections, sortFavoriteItems } from "@/lib/favorites-sort";

function item(id: string, title: string, type: string, date: string) {
  return { id, title, updatedAt: new Date(date), type: { name: type } };
}

function collection(id: string, name: string, types: string[], date: string) {
  return { id, name, updatedAt: new Date(date), types: types.map((name) => ({ name })) };
}

const items = [
  item("a", "beta", "snippet", "2026-10-01"),
  item("b", "Alpha", "prompt", "2026-10-03"),
  item("c", "gamma", "snippet", "2026-10-02"),
  item("d", "alpha", "link", "2026-10-03"),
];

const ids = (rows: { id: string }[]) => rows.map((row) => row.id);

describe("sortFavoriteItems", () => {
  it("sorts by date, newest first, with ties by name then id", () => {
    expect(ids(sortFavoriteItems(items, "date"))).toEqual(["b", "d", "c", "a"]);
  });

  it("sorts by name ignoring case, with ties by id", () => {
    expect(ids(sortFavoriteItems(items, "name"))).toEqual(["b", "d", "a", "c"]);
  });

  it("groups by type name, then sorts by title", () => {
    expect(ids(sortFavoriteItems(items, "type"))).toEqual(["d", "b", "a", "c"]);
  });

  it("sorts numbers in names naturally", () => {
    const numbered = [item("x", "Item 10", "note", "2026-10-01"), item("y", "Item 2", "note", "2026-10-01")];
    expect(ids(sortFavoriteItems(numbered, "name"))).toEqual(["y", "x"]);
  });

  it("returns a copy without changing the input", () => {
    const before = ids(items);
    expect(sortFavoriteItems(items, "name")).not.toBe(items);
    expect(ids(items)).toEqual(before);
  });
});

describe("sortFavoriteCollections", () => {
  const collections = [
    collection("1", "React", ["snippet", "note"], "2026-10-01"),
    collection("2", "Empty", [], "2026-10-05"),
    collection("3", "AI", ["prompt"], "2026-10-02"),
    collection("4", "DevOps", ["command", "snippet"], "2026-10-03"),
  ];

  it("sorts by date and name", () => {
    expect(ids(sortFavoriteCollections(collections, "date"))).toEqual(["2", "4", "3", "1"]);
    expect(ids(sortFavoriteCollections(collections, "name"))).toEqual(["3", "4", "2", "1"]);
  });

  it("sorts by most-used type, with empty collections last", () => {
    expect(ids(sortFavoriteCollections(collections, "type"))).toEqual(["4", "3", "1", "2"]);
  });
});
