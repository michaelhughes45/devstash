"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { EMAIL_NOT_VERIFIED_CODE } from "@/lib/auth-errors";
import { safeCallbackUrl } from "@/lib/safe-callback-url";
import { signInSchema } from "@/lib/validations/auth";

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
