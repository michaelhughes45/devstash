import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCollection,
  deleteCollection,
  toggleCollectionFavorite,
  updateCollection,
} from "@/actions/collections";
import {
  createCollection as createCollectionRecord,
  deleteCollection as deleteCollectionRecord,
  setCollectionFavorite,
  updateCollection as updateCollectionRecord,
} from "@/lib/db/collections";
import { getCurrentUserId } from "@/lib/session";

vi.mock("@/lib/session", () => ({ getCurrentUserId: vi.fn() }));
vi.mock("@/lib/db/collections", () => ({
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
  setCollectionFavorite: vi.fn(),
}));

const createdAt = new Date("2026-10-08T10:00:00Z");

describe("createCollection action", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
  });

  it("rejects signed-out users without saving", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);

    const result = await createCollection({ name: "React" });

    expect(result).toEqual({ success: false, error: "You need to be signed in to do that." });
    expect(createCollectionRecord).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input without saving", async () => {
    const result = await createCollection({ name: "  " });

    expect(result).toMatchObject({
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: { name: ["Name is required"] },
    });
    expect(createCollectionRecord).not.toHaveBeenCalled();
  });

  it("creates the collection for the signed-in user", async () => {
    vi.mocked(createCollectionRecord).mockResolvedValue({
      id: "col-1",
      name: "React",
      description: null,
      createdAt,
    });

    const result = await createCollection({ name: " React ", description: "" });

    expect(createCollectionRecord).toHaveBeenCalledWith("user-1", {
      name: "React",
      description: null,
    });
    expect(result).toEqual({
      success: true,
      data: { id: "col-1", name: "React", description: null, createdAt: createdAt.toISOString() },
    });
  });

  it("ignores a userId sent by the client", async () => {
    vi.mocked(createCollectionRecord).mockResolvedValue({
      id: "col-1",
      name: "React",
      description: null,
      createdAt,
    });

    await createCollection({ name: "React", userId: "user-2" } as never);

    expect(createCollectionRecord).toHaveBeenCalledWith("user-1", {
      name: "React",
      description: null,
    });
  });

  it("returns a generic error when the save fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createCollectionRecord).mockRejectedValue(new Error("db down"));

    const result = await createCollection({ name: "React" });

    expect(result).toEqual({ success: false, error: "Something went wrong. Please try again." });
  });
});

describe("updateCollection action", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
  });

  it("rejects signed-out users without saving", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);

    const result = await updateCollection("col-1", { name: "React" });

    expect(result).toEqual({ success: false, error: "You need to be signed in to do that." });
    expect(updateCollectionRecord).not.toHaveBeenCalled();
  });

  it("rejects an invalid id without saving", async () => {
    const result = await updateCollection("", { name: "React" });

    expect(result).toEqual({ success: false, error: "Collection not found." });
    expect(updateCollectionRecord).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input without saving", async () => {
    const result = await updateCollection("col-1", { name: " " });

    expect(result).toMatchObject({
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: { name: ["Name is required"] },
    });
    expect(updateCollectionRecord).not.toHaveBeenCalled();
  });

  it("saves the trimmed values for the signed-in user", async () => {
    const saved = { id: "col-1", name: "React", description: null, isFavorite: true };
    vi.mocked(updateCollectionRecord).mockResolvedValue(saved);

    const result = await updateCollection("col-1", { name: " React ", description: " " });

    expect(updateCollectionRecord).toHaveBeenCalledWith("user-1", "col-1", {
      name: "React",
      description: null,
    });
    expect(result).toEqual({ success: true, data: saved });
  });

  it("reports a missing or someone else's collection", async () => {
    vi.mocked(updateCollectionRecord).mockResolvedValue(null);

    const result = await updateCollection("col-2", { name: "React" });

    expect(result).toEqual({ success: false, error: "Collection not found." });
  });

  it("returns a generic error when the save fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(updateCollectionRecord).mockRejectedValue(new Error("db down"));

    const result = await updateCollection("col-1", { name: "React" });

    expect(result).toEqual({ success: false, error: "Something went wrong. Please try again." });
  });
});

describe("deleteCollection action", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
  });

  it("rejects signed-out users without deleting", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);

    const result = await deleteCollection("col-1");

    expect(result).toEqual({ success: false, error: "You need to be signed in to do that." });
    expect(deleteCollectionRecord).not.toHaveBeenCalled();
  });

  it("rejects an invalid id without deleting", async () => {
    const result = await deleteCollection("a".repeat(65));

    expect(result).toEqual({ success: false, error: "Collection not found." });
    expect(deleteCollectionRecord).not.toHaveBeenCalled();
  });

  it("deletes the signed-in user's collection", async () => {
    vi.mocked(deleteCollectionRecord).mockResolvedValue(true);

    expect(await deleteCollection("col-1")).toEqual({ success: true });
    expect(deleteCollectionRecord).toHaveBeenCalledWith("user-1", "col-1");
  });

  it("reports a missing or someone else's collection", async () => {
    vi.mocked(deleteCollectionRecord).mockResolvedValue(false);

    expect(await deleteCollection("col-2")).toEqual({
      success: false,
      error: "Collection not found.",
    });
  });

  it("returns a generic error when the delete fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(deleteCollectionRecord).mockRejectedValue(new Error("db down"));

    expect(await deleteCollection("col-1")).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("toggleCollectionFavorite action", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
  });

  it("rejects signed-out users without saving", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);

    const result = await toggleCollectionFavorite("col-1", true);

    expect(result).toEqual({ success: false, error: "You need to be signed in to do that." });
    expect(setCollectionFavorite).not.toHaveBeenCalled();
  });

  it("rejects an invalid id without saving", async () => {
    const result = await toggleCollectionFavorite("a".repeat(65), true);

    expect(result).toEqual({ success: false, error: "Collection not found." });
    expect(setCollectionFavorite).not.toHaveBeenCalled();
  });

  it("rejects a value that isn't a boolean without saving", async () => {
    const result = await toggleCollectionFavorite("col-1", "yes" as unknown as boolean);

    expect(result).toMatchObject({ success: false });
    expect(setCollectionFavorite).not.toHaveBeenCalled();
  });

  it("sets the requested value for the signed-in user", async () => {
    vi.mocked(setCollectionFavorite).mockResolvedValue(false);

    expect(await toggleCollectionFavorite("col-1", false)).toEqual({
      success: true,
      data: { isFavorite: false },
    });
    expect(setCollectionFavorite).toHaveBeenCalledWith("user-1", "col-1", false);
  });

  it("reports a missing or someone else's collection", async () => {
    vi.mocked(setCollectionFavorite).mockResolvedValue(null);

    expect(await toggleCollectionFavorite("col-1", true)).toEqual({ success: false, error: "Collection not found." });
  });

  it("returns a generic error when the save fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(setCollectionFavorite).mockRejectedValue(new Error("db down"));

    expect(await toggleCollectionFavorite("col-1", true)).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
