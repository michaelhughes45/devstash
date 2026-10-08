import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  attachUpload,
  discardUpload,
  getFileKey,
  resolveUpload,
  UPLOAD_NOT_FOUND,
} from "@/lib/item-uploads";
import { copyObject, deleteObjectQuietly, headObject } from "@/lib/r2";

// Key and URL helpers stay real; only the calls to R2 are mocked
vi.mock("@/lib/r2", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/r2")>()),
  headObject: vi.fn(),
  copyObject: vi.fn(),
  deleteObjectQuietly: vi.fn(),
}));

const R2_PUBLIC_URL = "https://files.example.com";
const pendingKey = "pending/user1/0f8fad5b-d9cb-469f-a165-70867728950e.pdf";
const finalKey = "user1/0f8fad5b-d9cb-469f-a165-70867728950e.pdf";

beforeEach(() => {
  vi.stubEnv("R2_PUBLIC_URL", R2_PUBLIC_URL);
  vi.mocked(headObject).mockResolvedValue({
    size: 2048,
    contentType: "application/pdf",
    originalName: "API Spec.pdf",
  });
});

describe("getFileKey", () => {
  it("returns the fileKey only when it's a string", () => {
    expect(getFileKey({ fileKey: pendingKey })).toBe(pendingKey);
    expect(getFileKey({ fileKey: 42 })).toBeNull();
    expect(getFileKey({ title: "Spec" })).toBeNull();
    expect(getFileKey(null)).toBeNull();
    expect(getFileKey("pending/user1/a.pdf")).toBeNull();
  });
});

describe("discardUpload", () => {
  it("deletes the user's own pending upload", async () => {
    await discardUpload("user1", pendingKey);

    expect(deleteObjectQuietly).toHaveBeenCalledWith(pendingKey);
  });

  it("ignores another user's key, a final key and a missing key", async () => {
    await discardUpload("user2", pendingKey);
    await discardUpload("user1", finalKey);
    await discardUpload("user1", null);

    expect(deleteObjectQuietly).not.toHaveBeenCalled();
  });
});

describe("resolveUpload", () => {
  it("reads the real name, size and type from R2 and points at the final key", async () => {
    expect(await resolveUpload("user1", "file", pendingKey)).toEqual({
      file: {
        fileUrl: `${R2_PUBLIC_URL}/${finalKey}`,
        fileName: "API Spec.pdf",
        fileSize: 2048,
      },
    });
    expect(headObject).toHaveBeenCalledWith(pendingKey);
  });

  it("rejects another user's key without reading it", async () => {
    expect(await resolveUpload("user2", "file", pendingKey)).toEqual({ error: UPLOAD_NOT_FOUND });
    expect(headObject).not.toHaveBeenCalled();
  });

  it("reports a missing upload as not found", async () => {
    vi.mocked(headObject).mockResolvedValue(null);

    expect(await resolveUpload("user1", "file", pendingKey)).toEqual({ error: UPLOAD_NOT_FOUND });
  });

  it("rejects a file over the type's size limit", async () => {
    vi.mocked(headObject).mockResolvedValue({
      size: 11 * 1024 * 1024,
      contentType: "application/pdf",
      originalName: "big.pdf",
    });

    expect(await resolveUpload("user1", "file", pendingKey)).toEqual({
      error: "File is too large. The limit is 10 MB.",
    });
  });

  it("rejects a key whose extension doesn't match the stored type", async () => {
    vi.mocked(headObject).mockResolvedValue({
      size: 2048,
      contentType: "text/plain",
      originalName: "notes.pdf",
    });

    expect(await resolveUpload("user1", "file", pendingKey)).toEqual({
      error: "This file can't be used for this item type.",
    });
  });

  it("rejects an upload made for a different item type", async () => {
    const result = await resolveUpload("user1", "image", pendingKey);

    expect(result).toHaveProperty("error");
  });
});

describe("attachUpload", () => {
  it("copies a valid upload to its final key", async () => {
    const result = await attachUpload("user1", "file", pendingKey);

    expect(result).toHaveProperty("file");
    expect(copyObject).toHaveBeenCalledWith(pendingKey, finalKey);
  });

  it("doesn't copy a rejected upload", async () => {
    vi.mocked(headObject).mockResolvedValue(null);

    expect(await attachUpload("user1", "file", pendingKey)).toEqual({ error: UPLOAD_NOT_FOUND });
    expect(copyObject).not.toHaveBeenCalled();
  });
});
