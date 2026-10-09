import { describe, expect, it } from "vitest";

import { toSearchPreview } from "@/lib/search-preview";

describe("toSearchPreview", () => {
  it("collapses whitespace and line breaks into one line", () => {
    expect(toSearchPreview("  const a = 1;\n\n\tconst b = 2;  ")).toBe("const a = 1; const b = 2;");
  });

  it("returns an empty string for missing text", () => {
    expect(toSearchPreview(null)).toBe("");
  });

  it("keeps text at the limit and cuts longer text with an ellipsis", () => {
    expect(toSearchPreview("abcde", 5)).toBe("abcde");
    expect(toSearchPreview("abcd efgh", 6)).toBe("abcd…");
    expect(toSearchPreview("x".repeat(200))).toHaveLength(120);
  });
});
