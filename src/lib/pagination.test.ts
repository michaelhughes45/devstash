import { describe, expect, it } from "vitest";

import { getPageCount, getPageLinks, pageHref, pageRange, parsePage } from "@/lib/pagination";

describe("parsePage", () => {
  it("reads a whole page number from 1 up", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage(["2", "5"])).toBe(2);
  });

  it("falls back to page 1 for missing or invalid values", () => {
    for (const value of [undefined, "", "0", "-1", "1.5", "abc", "2abc", "99999999999999999999"]) {
      expect(parsePage(value)).toBe(1);
    }
  });
});

describe("pageRange", () => {
  it("skips the earlier pages", () => {
    expect(pageRange(1, 21)).toEqual({ skip: 0, take: 21 });
    expect(pageRange(3, 21)).toEqual({ skip: 42, take: 21 });
  });
});

describe("getPageCount", () => {
  it("rounds up, with at least one page", () => {
    expect(getPageCount(0, 21)).toBe(1);
    expect(getPageCount(21, 21)).toBe(1);
    expect(getPageCount(22, 21)).toBe(2);
  });
});

describe("getPageLinks", () => {
  it("lists every page when there are few", () => {
    expect(getPageLinks(1, 1)).toEqual([1]);
    expect(getPageLinks(2, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageLinks(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("collapses gaps to an ellipsis around the current page", () => {
    expect(getPageLinks(1, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10]);
    expect(getPageLinks(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
    expect(getPageLinks(10, 10)).toEqual([1, "ellipsis", 6, 7, 8, 9, 10]);
  });

  it("shows a single skipped page instead of an ellipsis", () => {
    expect(getPageLinks(4, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10]);
  });
});

describe("pageHref", () => {
  it("leaves the page param off page 1", () => {
    expect(pageHref("/items/snippets", 1)).toBe("/items/snippets");
    expect(pageHref("/items/snippets", 2)).toBe("/items/snippets?page=2");
  });
});
