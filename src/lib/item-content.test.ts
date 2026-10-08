import { describe, expect, it } from "vitest";

import {
  buildItemInput,
  formatFileSize,
  getCardCopySource,
  getContentTypeForType,
  getCreateFields,
  getEditableFields,
  getFileIconName,
  getItemCopyText,
  isCodeType,
  isFileType,
  isImageType,
  isMarkdownType,
  parseTags,
  safeExternalUrl,
} from "@/lib/item-content";

describe("isCodeType", () => {
  it("is true for snippets and commands only", () => {
    expect(isCodeType("snippet")).toBe(true);
    expect(isCodeType("command")).toBe(true);
    expect(isCodeType("prompt")).toBe(false);
    expect(isCodeType("note")).toBe(false);
    expect(isCodeType("link")).toBe(false);
  });
});

describe("isMarkdownType", () => {
  it("is true for notes and prompts only", () => {
    expect(isMarkdownType("note")).toBe(true);
    expect(isMarkdownType("prompt")).toBe(true);
    expect(isMarkdownType("snippet")).toBe(false);
    expect(isMarkdownType("command")).toBe(false);
    expect(isMarkdownType("link")).toBe(false);
  });
});

describe("isImageType", () => {
  it("is true for images only", () => {
    expect(isImageType("image")).toBe(true);
    expect(isImageType("file")).toBe(false);
    expect(isImageType("snippet")).toBe(false);
    expect(isImageType("Image")).toBe(false);
  });
});

describe("getCreateFields", () => {
  it("shows content and language for snippets and commands", () => {
    const expected = { content: true, language: true, markdown: false, url: false };
    expect(getCreateFields("snippet")).toEqual(expected);
    expect(getCreateFields("command")).toEqual(expected);
  });

  it("shows markdown content for prompts and notes", () => {
    const expected = { content: true, language: false, markdown: true, url: false };
    expect(getCreateFields("prompt")).toEqual(expected);
    expect(getCreateFields("note")).toEqual(expected);
  });

  it("shows only the URL for links", () => {
    expect(getCreateFields("link")).toEqual({
      content: false,
      language: false,
      markdown: false,
      url: true,
    });
  });
});

describe("getContentTypeForType", () => {
  it("stores links as URL, uploads as FILE and everything else as text", () => {
    expect(getContentTypeForType("link")).toBe("URL");
    expect(getContentTypeForType("file")).toBe("FILE");
    expect(getContentTypeForType("image")).toBe("FILE");
    expect(getContentTypeForType("snippet")).toBe("TEXT");
    expect(getContentTypeForType("note")).toBe("TEXT");
  });
});

describe("buildItemInput", () => {
  const values = {
    title: "Docs",
    description: "Reference",
    content: "stray content",
    language: "ts",
    url: "https://nextjs.org",
    tags: "next, docs, next",
  };

  it("sends only the fields the form shows, with tags parsed", () => {
    expect(buildItemInput(values, { content: false, language: false, markdown: false, url: true })).toEqual({
      title: "Docs",
      description: "Reference",
      tags: ["next", "docs"],
      url: "https://nextjs.org",
    });
    expect(buildItemInput(values, { content: true, language: true, markdown: false, url: false })).toEqual({
      title: "Docs",
      description: "Reference",
      tags: ["next", "docs"],
      content: "stray content",
      language: "ts",
    });
  });
});

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

describe("getCardCopySource", () => {
  const base = { url: null, fileUrl: null };

  it("fetches text items, since cards don't load their content", () => {
    expect(getCardCopySource({ ...base, contentType: "TEXT" })).toEqual({ kind: "fetch" });
  });

  it("copies a link's URL straight away", () => {
    expect(
      getCardCopySource({ ...base, contentType: "URL", url: "https://example.com" }),
    ).toEqual({ kind: "text", text: "https://example.com" });
  });

  it("copies a file's URL straight away", () => {
    expect(
      getCardCopySource({ ...base, contentType: "FILE", fileUrl: "https://cdn.test/a.pdf" }),
    ).toEqual({ kind: "text", text: "https://cdn.test/a.pdf" });
  });

  it("returns null for a link or file without a URL", () => {
    expect(getCardCopySource({ ...base, contentType: "URL" })).toBeNull();
    expect(getCardCopySource({ ...base, contentType: "URL", url: "  " })).toBeNull();
    expect(getCardCopySource({ ...base, contentType: "FILE" })).toBeNull();
  });
});

describe("isFileType", () => {
  it("is true for files only", () => {
    expect(isFileType("file")).toBe(true);
    expect(isFileType("image")).toBe(false);
    expect(isFileType("snippet")).toBe(false);
  });
});

describe("getFileIconName", () => {
  it("picks an icon by extension, case-insensitive", () => {
    expect(getFileIconName("report.pdf")).toBe("FileText");
    expect(getFileIconName("README.MD")).toBe("FileText");
    expect(getFileIconName("package.json")).toBe("FileBraces");
    expect(getFileIconName("feed.xml")).toBe("FileCode");
    expect(getFileIconName("data.csv")).toBe("FileSpreadsheet");
    expect(getFileIconName("config.yml")).toBe("FileCog");
  });

  it("falls back to a plain file for unknown, missing or no extensions", () => {
    expect(getFileIconName("archive.zip")).toBe("File");
    expect(getFileIconName("Makefile")).toBe("File");
    expect(getFileIconName(".env")).toBe("File");
    expect(getFileIconName(null)).toBe("File");
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

describe("parseTags", () => {
  it("splits on commas, trims and drops blanks and repeats", () => {
    expect(parseTags(" react, hooks ,, react ,")).toEqual(["react", "hooks"]);
  });

  it("returns an empty list for an empty input", () => {
    expect(parseTags("   ")).toEqual([]);
  });
});

describe("getEditableFields", () => {
  it.each([
    ["snippet", "TEXT", { content: true, language: true, markdown: false, url: false }],
    ["command", "TEXT", { content: true, language: true, markdown: false, url: false }],
    ["prompt", "TEXT", { content: true, language: false, markdown: true, url: false }],
    ["note", "TEXT", { content: true, language: false, markdown: true, url: false }],
    ["link", "URL", { content: false, language: false, markdown: false, url: true }],
    ["file", "FILE", { content: false, language: false, markdown: false, url: false }],
    ["image", "FILE", { content: false, language: false, markdown: false, url: false }],
    ["recipe", "TEXT", { content: true, language: false, markdown: false, url: false }],
  ] as const)("shows the right fields for a %s", (name, contentType, expected) => {
    expect(getEditableFields({ contentType, type: { name } })).toEqual(expected);
  });
});
