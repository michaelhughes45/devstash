import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateEditorPreferences } from "@/actions/editor-preferences";
import { updateEditorPreferences as updateEditorPreferencesRecord } from "@/lib/db/users";
import { getCurrentUserId } from "@/lib/session";

vi.mock("@/lib/session", () => ({ getCurrentUserId: vi.fn() }));
vi.mock("@/lib/db/users", () => ({ updateEditorPreferences: vi.fn() }));

const preferences = {
  fontSize: 15,
  tabSize: 8,
  wordWrap: true,
  minimap: true,
  theme: "monokai",
} as const;

describe("updateEditorPreferences action", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
  });

  it("rejects signed-out users without saving", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);

    const result = await updateEditorPreferences(preferences);

    expect(result).toEqual({ success: false, error: "You need to be signed in to do that." });
    expect(updateEditorPreferencesRecord).not.toHaveBeenCalled();
  });

  it("rejects invalid preferences without saving", async () => {
    const result = await updateEditorPreferences({ ...preferences, theme: "light" });

    expect(result).toEqual({ success: false, error: "Those editor settings aren't valid." });
    expect(updateEditorPreferencesRecord).not.toHaveBeenCalled();
  });

  it("saves only the known fields for the signed-in user", async () => {
    vi.mocked(updateEditorPreferencesRecord).mockResolvedValue(preferences);

    const result = await updateEditorPreferences({ ...preferences, userId: "user-2" });

    expect(updateEditorPreferencesRecord).toHaveBeenCalledWith("user-1", preferences);
    expect(result).toEqual({ success: true, data: preferences });
  });

  it("treats a deleted user as signed out", async () => {
    vi.mocked(updateEditorPreferencesRecord).mockResolvedValue(null);

    const result = await updateEditorPreferences(preferences);

    expect(result).toEqual({ success: false, error: "You need to be signed in to do that." });
  });

  it("returns a generic error when saving fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(updateEditorPreferencesRecord).mockRejectedValue(new Error("connection lost"));

    const result = await updateEditorPreferences(preferences);

    expect(result).toEqual({
      success: false,
      error: "Couldn't save your editor settings. Please try again.",
    });
  });
});
