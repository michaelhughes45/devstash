import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCollection } from "@/actions/collections";
import { createCollection as createCollectionRecord } from "@/lib/db/collections";
import { getCurrentUserId } from "@/lib/session";

vi.mock("@/lib/session", () => ({ getCurrentUserId: vi.fn() }));
vi.mock("@/lib/db/collections", () => ({ createCollection: vi.fn() }));

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
