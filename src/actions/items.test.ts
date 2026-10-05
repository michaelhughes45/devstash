import { beforeEach, describe, expect, it, vi } from "vitest";

import { createItem, deleteItem, updateItem } from "@/actions/items";
import {
  createItem as createItemRecord,
  deleteItem as deleteItemRecord,
  updateItem as updateItemRecord,
  type ItemDetail,
} from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/session";

vi.mock("@/lib/session", () => ({ getCurrentUserId: vi.fn() }));
vi.mock("@/lib/db/items", () => ({
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}));

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
      type: "file" as unknown as "snippet",
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
    });
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
    vi.mocked(deleteItemRecord).mockResolvedValue(true);

    const result = await deleteItem("item-1");

    expect(deleteItemRecord).toHaveBeenCalledWith("user-1", "item-1");
    expect(result).toEqual({ success: true });
  });

  it("reports a missing or someone else's item as not found", async () => {
    vi.mocked(deleteItemRecord).mockResolvedValue(false);

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
