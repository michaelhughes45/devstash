import { beforeEach, describe, expect, it, vi } from "vitest";

import { createItem, deleteItem, updateItem } from "@/actions/items";
import {
  createItem as createItemRecord,
  deleteItem as deleteItemRecord,
  isUniqueViolation,
  updateItem as updateItemRecord,
  type ItemDetail,
} from "@/lib/db/items";
import { copyObject, deleteObjectQuietly, headObject } from "@/lib/r2";
import { getCurrentUserId } from "@/lib/session";

vi.mock("@/lib/session", () => ({ getCurrentUserId: vi.fn() }));
vi.mock("@/lib/db/items", () => ({
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  isUniqueViolation: vi.fn(),
}));
// Key and URL helpers stay real; only the calls to R2 are mocked
vi.mock("@/lib/r2", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/r2")>()),
  headObject: vi.fn(),
  copyObject: vi.fn(),
  deleteObjectQuietly: vi.fn(),
}));

const R2_PUBLIC_URL = "https://files.example.com";

const createdAt = new Date("2026-01-15T10:00:00Z");
const updatedAt = new Date("2026-02-01T12:00:00Z");

const savedItem: ItemDetail = {
  id: "item-1",
  title: "useAuth Hook",
  description: null,
  isFavorite: false,
  isPinned: false,
  createdAt,
  updatedAt,
  contentType: "TEXT",
  content: "export function useAuth() {}",
  language: "typescript",
  url: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  type: { id: "type-1", name: "snippet", icon: "Code", color: "#3b82f6" },
  tags: ["react"],
  collections: [],
};

const validInput = {
  title: "  useAuth Hook ",
  description: "",
  content: "export function useAuth() {}",
  language: "typescript",
  tags: ["react", "react"],
};

beforeEach(() => {
  vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
  vi.stubEnv("R2_PUBLIC_URL", R2_PUBLIC_URL);
});

describe("updateItem", () => {
  it("rejects signed-out users without touching the item", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);

    const result = await updateItem("item-1", validInput);

    expect(result).toEqual({
      success: false,
      error: "You need to be signed in to do that.",
    });
    expect(updateItemRecord).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input", async () => {
    const result = await updateItem("item-1", {
      title: " ",
      url: "ftp://example.com",
      tags: [],
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe("Please fix the highlighted fields.");
    expect(result.fieldErrors?.title).toEqual(["Title is required"]);
    expect(result.fieldErrors?.url).toEqual(["Enter a valid http or https URL"]);
    expect(updateItemRecord).not.toHaveBeenCalled();
  });

  it("saves the validated data for the signed-in user", async () => {
    vi.mocked(updateItemRecord).mockResolvedValue(savedItem);

    await updateItem("item-1", validInput);

    expect(updateItemRecord).toHaveBeenCalledWith("user-1", "item-1", {
      title: "useAuth Hook",
      description: null,
      content: "export function useAuth() {}",
      language: "typescript",
      tags: ["react"],
    });
  });

  it("returns the updated item with ISO dates", async () => {
    vi.mocked(updateItemRecord).mockResolvedValue(savedItem);

    const result = await updateItem("item-1", validInput);

    expect(result).toEqual({
      success: true,
      data: {
        ...savedItem,
        createdAt: "2026-01-15T10:00:00.000Z",
        updatedAt: "2026-02-01T12:00:00.000Z",
      },
    });
  });

  it("reports a missing or someone else's item as not found", async () => {
    vi.mocked(updateItemRecord).mockResolvedValue(null);

    const result = await updateItem("other-users-item", validInput);

    expect(result).toEqual({ success: false, error: "Item not found." });
  });

  it("returns a generic error when the update throws", async () => {
    vi.mocked(updateItemRecord).mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await updateItem("item-1", validInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("createItem", () => {
  const createInput = { type: "snippet" as const, ...validInput };

  it("rejects signed-out users without creating anything", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);

    const result = await createItem(createInput);

    expect(result).toEqual({
      success: false,
      error: "You need to be signed in to do that.",
    });
    expect(createItemRecord).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input", async () => {
    const result = await createItem({ type: "link", title: "Docs", url: "", tags: [] });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe("Please fix the highlighted fields.");
    expect(result.fieldErrors?.url).toEqual(["URL is required"]);
    expect(createItemRecord).not.toHaveBeenCalled();
  });

  it("rejects a type the dialog doesn't offer", async () => {
    const result = await createItem({
      ...createInput,
      type: "folder" as unknown as "snippet",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.fieldErrors?.type).toEqual(["Choose an item type"]);
    expect(createItemRecord).not.toHaveBeenCalled();
  });

  it("creates the validated item for the signed-in user", async () => {
    vi.mocked(createItemRecord).mockResolvedValue(savedItem);

    await createItem(createInput);

    expect(createItemRecord).toHaveBeenCalledWith("user-1", {
      type: "snippet",
      title: "useAuth Hook",
      description: null,
      content: "export function useAuth() {}",
      language: "typescript",
      url: null,
      tags: ["react"],
    }, null);
  });

  it("returns the created item with ISO dates", async () => {
    vi.mocked(createItemRecord).mockResolvedValue(savedItem);

    const result = await createItem(createInput);

    expect(result).toEqual({
      success: true,
      data: {
        ...savedItem,
        createdAt: "2026-01-15T10:00:00.000Z",
        updatedAt: "2026-02-01T12:00:00.000Z",
      },
    });
  });

  it("returns a generic error when the system type is missing", async () => {
    vi.mocked(createItemRecord).mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createItem(createInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });

  it("returns a generic error when the create throws", async () => {
    vi.mocked(createItemRecord).mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createItem(createInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("createItem with an upload", () => {
  const fileKey = "pending/user1/0f8fad5b-d9cb-469f-a165-70867728950e.pdf";
  const finalKey = "user1/0f8fad5b-d9cb-469f-a165-70867728950e.pdf";
  const fileInput = { type: "file" as const, title: "Spec", tags: [], fileKey };
  const UPLOAD_NOT_FOUND = "The upload wasn't found. Please choose the file again.";

  beforeEach(() => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user1");
    vi.mocked(headObject).mockResolvedValue({
      size: 2048,
      contentType: "application/pdf",
      originalName: "API Spec.pdf",
    });
    vi.mocked(createItemRecord).mockResolvedValue(savedItem);
  });

  it("moves the upload out of pending/ and stores the details read from R2", async () => {
    const result = await createItem(fileInput);

    expect(result.success).toBe(true);
    expect(headObject).toHaveBeenCalledWith(fileKey);
    expect(copyObject).toHaveBeenCalledWith(fileKey, finalKey);
    expect(createItemRecord).toHaveBeenCalledWith(
      "user1",
      expect.objectContaining({ type: "file", title: "Spec" }),
      {
        fileUrl: `${R2_PUBLIC_URL}/${finalKey}`,
        fileName: "API Spec.pdf",
        fileSize: 2048,
      },
    );
    expect(deleteObjectQuietly).toHaveBeenCalledWith(fileKey);
    expect(deleteObjectQuietly).not.toHaveBeenCalledWith(finalKey);
  });

  it("requires an upload for file and image items", async () => {
    const result = await createItem({ ...fileInput, fileKey: undefined });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.fieldErrors?.file).toEqual(["Choose a file to upload"]);
    expect(createItemRecord).not.toHaveBeenCalled();
  });

  it("rejects another user's upload without reading or deleting it", async () => {
    const result = await createItem({
      ...fileInput,
      fileKey: "pending/user2/0f8fad5b-d9cb-469f-a165-70867728950e.pdf",
    });

    expect(result.success).toBe(false);
    expect(headObject).not.toHaveBeenCalled();
    expect(deleteObjectQuietly).not.toHaveBeenCalled();
    expect(createItemRecord).not.toHaveBeenCalled();
  });

  it("rejects an item's final key, so an attached file can't be reused", async () => {
    const result = await createItem({ ...fileInput, fileKey: finalKey });

    expect(result.success).toBe(false);
    expect(headObject).not.toHaveBeenCalled();
    expect(deleteObjectQuietly).not.toHaveBeenCalled();
  });

  it("rejects a missing upload", async () => {
    vi.mocked(headObject).mockResolvedValue(null);

    const result = await createItem(fileInput);

    expect(result).toEqual(
      expect.objectContaining({ success: false, error: UPLOAD_NOT_FOUND }),
    );
    expect(copyObject).not.toHaveBeenCalled();
    expect(createItemRecord).not.toHaveBeenCalled();
  });

  it("rejects and deletes a stored file over the type's size limit", async () => {
    vi.mocked(headObject).mockResolvedValue({
      size: 11 * 1024 * 1024,
      contentType: "application/pdf",
      originalName: "big.pdf",
    });

    const result = await createItem(fileInput);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.fieldErrors?.file).toEqual(["File is too large. The limit is 10 MB."]);
    expect(deleteObjectQuietly).toHaveBeenCalledWith(fileKey);
    expect(copyObject).not.toHaveBeenCalled();
    expect(createItemRecord).not.toHaveBeenCalled();
  });

  it("rejects a file upload used as an image", async () => {
    const result = await createItem({ ...fileInput, type: "image" });

    expect(result.success).toBe(false);
    expect(deleteObjectQuietly).toHaveBeenCalledWith(fileKey);
    expect(createItemRecord).not.toHaveBeenCalled();
  });

  it("deletes the upload when the other fields are invalid", async () => {
    const result = await createItem({ ...fileInput, title: " " });

    expect(result.success).toBe(false);
    expect(deleteObjectQuietly).toHaveBeenCalledWith(fileKey);
  });

  it("deletes both copies when the create throws", async () => {
    vi.mocked(createItemRecord).mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createItem(fileInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
    expect(deleteObjectQuietly).toHaveBeenCalledWith(fileKey);
    expect(deleteObjectQuietly).toHaveBeenCalledWith(finalKey);
  });

  it("deletes both copies when the system type is missing", async () => {
    vi.mocked(createItemRecord).mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect((await createItem(fileInput)).success).toBe(false);
    expect(deleteObjectQuietly).toHaveBeenCalledWith(finalKey);
  });

  it("keeps the final file when another create already attached it", async () => {
    vi.mocked(createItemRecord).mockRejectedValue(new Error("unique"));
    vi.mocked(isUniqueViolation).mockReturnValue(true);

    const result = await createItem(fileInput);

    expect(result).toEqual({ success: false, error: UPLOAD_NOT_FOUND });
    expect(deleteObjectQuietly).not.toHaveBeenCalledWith(finalKey);
  });

  it("ignores a stray upload key on a text item", async () => {
    await createItem({ type: "snippet" as const, ...validInput, fileKey });

    expect(headObject).not.toHaveBeenCalled();
    expect(deleteObjectQuietly).not.toHaveBeenCalled();
    expect(createItemRecord).toHaveBeenCalledWith(
      "user1",
      expect.not.objectContaining({ fileKey }),
      null,
    );
  });
});

describe("deleteItem", () => {
  it("rejects signed-out users without touching the item", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);

    const result = await deleteItem("item-1");

    expect(result).toEqual({
      success: false,
      error: "You need to be signed in to do that.",
    });
    expect(deleteItemRecord).not.toHaveBeenCalled();
  });

  it("rejects an invalid id without touching the database", async () => {
    expect(await deleteItem("")).toEqual({ success: false, error: "Item not found." });
    expect(await deleteItem(42 as unknown as string)).toEqual({
      success: false,
      error: "Item not found.",
    });
    expect(deleteItemRecord).not.toHaveBeenCalled();
  });

  it("deletes the item for the signed-in user", async () => {
    vi.mocked(deleteItemRecord).mockResolvedValue({ fileUrl: null });

    const result = await deleteItem("item-1");

    expect(deleteItemRecord).toHaveBeenCalledWith("user-1", "item-1");
    expect(result).toEqual({ success: true });
    expect(deleteObjectQuietly).not.toHaveBeenCalled();
  });

  it("deletes a file item's stored file from R2", async () => {
    vi.mocked(deleteItemRecord).mockResolvedValue({
      fileUrl: `${R2_PUBLIC_URL}/user-1/abc.pdf`,
    });

    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: true });
    expect(deleteObjectQuietly).toHaveBeenCalledWith("user-1/abc.pdf");
  });

  it("leaves a file URL that isn't in the bucket alone", async () => {
    vi.mocked(deleteItemRecord).mockResolvedValue({
      fileUrl: "https://elsewhere.example.com/user-1/abc.pdf",
    });

    expect(await deleteItem("item-1")).toEqual({ success: true });
    expect(deleteObjectQuietly).not.toHaveBeenCalled();
  });

  it("reports a missing or someone else's item as not found", async () => {
    vi.mocked(deleteItemRecord).mockResolvedValue(null);

    const result = await deleteItem("other-users-item");

    expect(result).toEqual({ success: false, error: "Item not found." });
  });

  it("returns a generic error when the delete throws", async () => {
    vi.mocked(deleteItemRecord).mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteItem("item-1");

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
