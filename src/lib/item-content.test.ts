import { describe, expect, it } from "vitest";

import { formatFileSize, getItemCopyText, safeExternalUrl } from "@/lib/item-content";

describe("safeExternalUrl", () => {
  it("allows http and https links", () => {
    expect(safeExternalUrl("https://example.com/docs")).toBe("https://example.com/docs");
    expect(safeExternalUrl("http://example.com")).toBe("http://example.com/");
  });

  it("rejects other protocols", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeExternalUrl("ftp://example.com")).toBeNull();
  });

  it("rejects empty and unparseable values", () => {
    expect(safeExternalUrl(null)).toBeNull();
    expect(safeExternalUrl("")).toBeNull();
    expect(safeExternalUrl("not a url")).toBeNull();
  });
});

describe("getItemCopyText", () => {
  const base = { content: null, url: null, fileUrl: null };

  it("copies the content of text items", () => {
    expect(
      getItemCopyText({ ...base, contentType: "TEXT", content: "npm run dev" }),
    ).toBe("npm run dev");
  });

  it("copies the URL of link items", () => {
    expect(
      getItemCopyText({
        ...base,
        contentType: "URL",
        url: "https://example.com",
        content: "ignored",
      }),
    ).toBe("https://example.com");
  });

  it("copies the file URL of file items", () => {
    expect(
      getItemCopyText({ ...base, contentType: "FILE", fileUrl: "https://cdn.test/a.png" }),
    ).toBe("https://cdn.test/a.png");
  });

  it("returns null when there is nothing to copy", () => {
    expect(getItemCopyText({ ...base, contentType: "TEXT" })).toBeNull();
    expect(getItemCopyText({ ...base, contentType: "TEXT", content: "   " })).toBeNull();
    expect(getItemCopyText({ ...base, contentType: "URL" })).toBeNull();
  });
});

describe("formatFileSize", () => {
  it("formats bytes with the largest fitting unit", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5 MB");
    expect(formatFileSize(3 * 1024 ** 4)).toBe("3072 GB");
  });
});
