import { describe, expect, it } from "vitest";

import {
  capitalize,
  compareItemTypes,
  getTypeDisplayName,
  getTypeSlug,
  isProSystemType,
} from "@/lib/item-type-names";

describe("capitalize", () => {
  it("uppercases the first letter only", () => {
    expect(capitalize("snippet")).toBe("Snippet");
    expect(capitalize("")).toBe("");
  });
});

describe("getTypeDisplayName", () => {
  it("pluralizes and capitalizes, leaving names ending in s alone", () => {
    expect(getTypeDisplayName("snippet")).toBe("Snippets");
    expect(getTypeDisplayName("docs")).toBe("Docs");
  });
});

describe("getTypeSlug", () => {
  it("lowercases, pluralizes and encodes", () => {
    expect(getTypeSlug("Recipe")).toBe("recipes");
    expect(getTypeSlug("my type")).toBe("my%20types");
  });
});

describe("isProSystemType", () => {
  it("is true only for the built-in file and image types", () => {
    expect(isProSystemType("file", true)).toBe(true);
    expect(isProSystemType("image", true)).toBe(true);
    expect(isProSystemType("file", false)).toBe(false);
    expect(isProSystemType("snippet", true)).toBe(false);
  });
});

describe("compareItemTypes", () => {
  it("puts system types in sidebar order before custom types sorted by name", () => {
    const types = [
      { name: "zeta", isSystem: false },
      { name: "link", isSystem: true },
      { name: "alpha", isSystem: false },
      { name: "snippet", isSystem: false },
      { name: "snippet", isSystem: true },
    ];

    expect(types.sort(compareItemTypes)).toEqual([
      { name: "snippet", isSystem: true },
      { name: "link", isSystem: true },
      { name: "alpha", isSystem: false },
      { name: "snippet", isSystem: false },
      { name: "zeta", isSystem: false },
    ]);
  });
});
