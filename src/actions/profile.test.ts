import { beforeEach, describe, expect, it, vi } from "vitest";

import { changePassword, deleteAccount } from "@/actions/profile";
import { signOut } from "@/auth";
import { changeUserPassword, deleteUserAccount } from "@/lib/account";
import { getCurrentUserId } from "@/lib/session";

vi.mock("@/auth", () => ({ signOut: vi.fn() }));
vi.mock("@/lib/session", () => ({ getCurrentUserId: vi.fn() }));
vi.mock("@/lib/account", () => ({
  changeUserPassword: vi.fn(),
  deleteUserAccount: vi.fn(),
}));

const INITIAL_STATE = { success: false };

function formData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const validChange = formData({
  currentPassword: "oldpassword",
  password: "newpassword123",
  confirmPassword: "newpassword123",
});

beforeEach(() => {
  vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
});

describe("changePassword", () => {
  it("rejects signed-out users without touching the account", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);

    const state = await changePassword(INITIAL_STATE, validChange);

    expect(state).toEqual({
      success: false,
      error: "You need to be signed in to do that.",
    });
    expect(changeUserPassword).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input", async () => {
    const state = await changePassword(
      INITIAL_STATE,
      formData({ currentPassword: "", password: "short", confirmPassword: "short" }),
    );

    expect(state.success).toBe(false);
    expect(state.fieldErrors?.currentPassword).toBeDefined();
    expect(state.fieldErrors?.password).toBeDefined();
    expect(changeUserPassword).not.toHaveBeenCalled();
  });

  it("reports a wrong current password on the field", async () => {
    vi.mocked(changeUserPassword).mockResolvedValue("wrong-password");

    const state = await changePassword(INITIAL_STATE, validChange);

    expect(state.fieldErrors).toEqual({
      currentPassword: ["Current password is incorrect"],
    });
    expect(signOut).not.toHaveBeenCalled();
  });

  it("returns a generic error when the change throws", async () => {
    vi.mocked(changeUserPassword).mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const state = await changePassword(INITIAL_STATE, validChange);

    expect(state).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });

  it("changes the password and signs out", async () => {
    vi.mocked(changeUserPassword).mockResolvedValue("changed");

    const state = await changePassword(INITIAL_STATE, validChange);

    expect(changeUserPassword).toHaveBeenCalledWith(
      "user-1",
      "oldpassword",
      "newpassword123",
    );
    expect(signOut).toHaveBeenCalledWith({
      redirectTo: "/sign-in?passwordChanged=1",
    });
    expect(state.success).toBe(true);
  });
});

describe("deleteAccount", () => {
  it("requires a confirmation", async () => {
    const state = await deleteAccount(INITIAL_STATE, new FormData());

    expect(state.fieldErrors?.confirmation).toEqual(["Confirmation is required"]);
    expect(deleteUserAccount).not.toHaveBeenCalled();
  });

  it.each([
    ["wrong-password", "Password is incorrect"],
    ["wrong-confirmation", "That doesn't match your email"],
  ] as const)("reports %s on the field", async (result, message) => {
    vi.mocked(deleteUserAccount).mockResolvedValue(result);

    const state = await deleteAccount(
      INITIAL_STATE,
      formData({ confirmation: "nope" }),
    );

    expect(state.fieldErrors).toEqual({ confirmation: [message] });
    expect(signOut).not.toHaveBeenCalled();
  });

  it("deletes the account and signs out", async () => {
    vi.mocked(deleteUserAccount).mockResolvedValue("deleted");

    const state = await deleteAccount(
      INITIAL_STATE,
      formData({ confirmation: "  my password  " }),
    );

    expect(deleteUserAccount).toHaveBeenCalledWith("user-1", "  my password  ");
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/sign-in?deleted=1" });
    expect(state.success).toBe(true);
  });
});
