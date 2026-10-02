"use server";

import { z } from "zod";
import { signOut } from "@/auth";
import { changeUserPassword, deleteUserAccount } from "@/lib/account";
import { getCurrentUserId } from "@/lib/session";
import { changePasswordSchema, deleteAccountSchema } from "@/lib/validations/auth";

const NOT_SIGNED_IN = "You need to be signed in to do that.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

export interface ChangePasswordState {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { success: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    const result = await changeUserPassword(
      userId,
      parsed.data.currentPassword,
      parsed.data.password,
    );
    if (result === "wrong-password") {
      return {
        success: false,
        fieldErrors: { currentPassword: ["Current password is incorrect"] },
      };
    }
    if (result === "no-password") {
      return { success: false, error: "Your account doesn't use a password." };
    }
    return { success: true };
  } catch (error) {
    console.error("Password change failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
}

export interface DeleteAccountState {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function deleteAccount(
  _prevState: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const parsed = deleteAccountSchema.safeParse({
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) {
    return { success: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    const result = await deleteUserAccount(userId, parsed.data.confirmation);
    if (result === "wrong-password") {
      return { success: false, fieldErrors: { confirmation: ["Password is incorrect"] } };
    }
    if (result === "wrong-confirmation") {
      return {
        success: false,
        fieldErrors: { confirmation: ["That doesn't match your email"] },
      };
    }
  } catch (error) {
    console.error("Account deletion failed", error);
    return { success: false, error: GENERIC_ERROR };
  }

  // Throws a redirect, so it stays outside the try/catch
  await signOut({ redirectTo: "/sign-in?deleted=1" });
  return { success: true };
}
