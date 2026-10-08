"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { AuthError, CredentialsSignin } from "next-auth";
import {
  EmailNotVerifiedError,
  SignInRateLimitedError,
  signIn,
  signOut,
} from "@/auth";
import {
  RESET_LINK_ERRORS,
  resetPassword,
  sendPasswordResetEmail,
  type ResetPasswordResult,
} from "@/lib/password-reset";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitMessage,
  type RateLimitName,
} from "@/lib/rate-limit";
import { safeCallbackUrl } from "@/lib/safe-callback-url";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
} from "@/lib/validations/auth";
import { fieldErrorsOf } from "@/lib/validations/field-errors";
import type { FieldErrors } from "@/types/forms";

export interface SignInState {
  success: boolean;
  email?: string;
  error?: string;
  rateLimitError?: string;
  fieldErrors?: FieldErrors;
}

async function checkActionRateLimit(name: RateLimitName, email?: string) {
  const { success, reset } = await checkRateLimit(name, rateLimitKey(await headers(), email));
  return success ? undefined : rateLimitMessage(reset);
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
      fieldErrors: fieldErrorsOf(parsed.error),
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
    if (error instanceof SignInRateLimitedError) {
      return { success: false, email, rateLimitError: rateLimitMessage(error.reset) };
    }
    if (error instanceof EmailNotVerifiedError) {
      return {
        success: false,
        email,
        error: error.linkSent
          ? "Please verify your email before signing in. We've sent you a new verification link."
          : "Please verify your email before signing in. Check your inbox for the verification link we sent you.",
      };
    }
    if (error instanceof CredentialsSignin) {
      return { success: false, email, error: "Invalid email or password" };
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
  rateLimitError?: string;
  fieldErrors?: FieldErrors;
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
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  // Keyed by IP only, so being limited says nothing about whether the account exists
  const rateLimitError = await checkActionRateLimit("forgotPassword");
  if (rateLimitError) return { success: false, email, rateLimitError };

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
  rateLimitError?: string;
  linkError?: boolean;
  fieldErrors?: FieldErrors;
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
    return { success: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const rateLimitError = await checkActionRateLimit("resetPassword");
  if (rateLimitError) return { success: false, rateLimitError };

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
