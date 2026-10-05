import { describe, expect, it } from "vitest";

import { safeCallbackUrl } from "@/lib/safe-callback-url";

describe("safeCallbackUrl", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeCallbackUrl("/items/snippets?page=2")).toBe("/items/snippets?page=2");
  });

  it.each([
    ["an absolute URL", "https://evil.example.com"],
    ["a protocol-relative URL", "//evil.example.com"],
    ["a backslash path", "/\\evil.example.com"],
    ["a path without a leading slash", "dashboard"],
    ["an empty string", ""],
  ])("falls back to /dashboard for %s", (_label, value) => {
    expect(safeCallbackUrl(value)).toBe("/dashboard");
  });

  it("falls back to /dashboard for non-strings", () => {
    expect(safeCallbackUrl(null)).toBe("/dashboard");
    expect(safeCallbackUrl(undefined)).toBe("/dashboard");
  });
});
