import { describe, expect, it } from "vitest";

import {
  formatMaxSize,
  getAcceptAttribute,
  getFileExtension,
  getStoredContentType,
  isFileItemType,
  validateUploadFile,
} from "@/lib/file-constraints";

const MB = 1024 * 1024;

describe("isFileItemType", () => {
  it("is true only for file and image", () => {
    expect(isFileItemType("file")).toBe(true);
    expect(isFileItemType("image")).toBe(true);
    expect(isFileItemType("snippet")).toBe(false);
    expect(isFileItemType("link")).toBe(false);
  });
});

describe("getFileExtension", () => {
  it("returns the lowercase last extension with the dot", () => {
    expect(getFileExtension("Photo.PNG")).toBe(".png");
    expect(getFileExtension("archive.tar.json")).toBe(".json");
  });

  it("returns an empty string without an extension", () => {
    expect(getFileExtension("README")).toBe("");
    expect(getFileExtension(".env")).toBe("");
  });
});

describe("getStoredContentType", () => {
  it("maps allowed extensions to their content type", () => {
    expect(getStoredContentType("image", "a.jpg")).toBe("image/jpeg");
    expect(getStoredContentType("image", "a.svg")).toBe("image/svg+xml");
    expect(getStoredContentType("file", "a.yml")).toBe("application/x-yaml");
    expect(getStoredContentType("file", "a.ini")).toBe("text/plain");
  });

  it("returns null for extensions the type doesn't allow", () => {
    expect(getStoredContentType("image", "a.pdf")).toBeNull();
    expect(getStoredContentType("file", "a.png")).toBeNull();
    expect(getStoredContentType("file", "a.exe")).toBeNull();
  });
});

describe("validateUploadFile", () => {
  it("accepts files within the type's rules", () => {
    expect(validateUploadFile("image", { name: "a.png", size: MB, type: "image/png" })).toBeNull();
    expect(
      validateUploadFile("file", { name: "a.pdf", size: 10 * MB, type: "application/pdf" }),
    ).toBeNull();
  });

  it("falls back to the extension when the browser reports no specific type", () => {
    expect(validateUploadFile("file", { name: "c.toml", size: 10, type: "" })).toBeNull();
    expect(
      validateUploadFile("file", { name: "c.md", size: 10, type: "application/octet-stream" }),
    ).toBeNull();
  });

  it("rejects extensions the type doesn't allow", () => {
    expect(validateUploadFile("image", { name: "a.pdf", size: 10, type: "application/pdf" })).toMatch(
      /^Image type not allowed/,
    );
    expect(validateUploadFile("file", { name: "run.exe", size: 10, type: "" })).toMatch(
      /^File type not allowed/,
    );
  });

  it("rejects a MIME type that doesn't match the type", () => {
    expect(validateUploadFile("image", { name: "a.png", size: 10, type: "text/html" })).toBe(
      "Image type not allowed.",
    );
  });

  it("rejects empty and oversized files", () => {
    expect(validateUploadFile("image", { name: "a.png", size: 0, type: "image/png" })).toBe(
      "Image is empty.",
    );
    expect(
      validateUploadFile("image", { name: "a.png", size: 5 * MB + 1, type: "image/png" }),
    ).toBe("Image is too large. The limit is 5 MB.");
    expect(
      validateUploadFile("file", { name: "a.pdf", size: 10 * MB + 1, type: "application/pdf" }),
    ).toBe("File is too large. The limit is 10 MB.");
  });

  it("rejects very long file names", () => {
    expect(
      validateUploadFile("file", { name: `${"a".repeat(260)}.txt`, size: 10, type: "text/plain" }),
    ).toBe("File name is too long.");
  });
});

describe("display helpers", () => {
  it("formats the size limit and accept list", () => {
    expect(formatMaxSize("image")).toBe("5 MB");
    expect(formatMaxSize("file")).toBe("10 MB");
    expect(getAcceptAttribute("image")).toBe(".png,.jpg,.jpeg,.gif,.webp,.svg");
  });
});
