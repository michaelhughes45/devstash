"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { AuthError, CredentialsSignin } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { EMAIL_NOT_VERIFIED_CODE } from "@/lib/auth-errors";
import {
  RESET_LINK_ERRORS,
  resetPassword,
  sendPasswordResetEmail,
  type ResetPasswordResult,
} from "@/lib/password-reset";
import { safeCallbackUrl } from "@/lib/safe-callback-url";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
} from "@/lib/validations/auth";

export interface SignInState {
  success: boolean;
  email?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function signInWithCredentials(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "");
  const parsed = signInSchema.safeParse({
    email,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      success: false,
      email,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    // Throws a redirect on success, which must propagate to Next.js
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
    });
    return { success: true };
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      return {
        success: false,
        email,
        error:
          error.code === EMAIL_NOT_VERIFIED_CODE
            ? "Please verify your email before signing in. We've sent you a new verification link."
            : "Invalid email or password",
      };
    }
    if (error instanceof AuthError) {
      return {
        success: false,
        email,
        error: "Something went wrong. Please try again.",
      };
    }
    throw error;
  }
}

export async function signInWithGitHub(formData: FormData) {
  await signIn("github", {
    redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
  });
}

export async function signOutUser() {
  await signOut({ redirectTo: "/sign-in" });
}

export interface ForgotPasswordState {
  success: boolean;
  email?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "");
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return {
      success: false,
      email,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  // Sent after the response, so its timing can't reveal whether the account exists
  after(async () => {
    try {
      await sendPasswordResetEmail(parsed.data.email);
    } catch (error) {
      console.error("Failed to send password reset email", error);
    }
  });

  return { success: true, email: parsed.data.email };
}

export interface ResetPasswordState {
  success: boolean;
  error?: string;
  linkError?: boolean;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function resetPasswordWithToken(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { success: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  let result: ResetPasswordResult;
  try {
    result = await resetPassword(parsed.data.token, parsed.data.password);
  } catch (error) {
    console.error("Password reset failed", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
  if (result !== "reset") {
    return { success: false, linkError: true, error: RESET_LINK_ERRORS[result] };
  }

  redirect("/sign-in?reset=1");
}
