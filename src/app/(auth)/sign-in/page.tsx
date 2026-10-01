import type { Metadata } from "next";
import Link from "next/link";

import { FormMessage } from "@/components/auth/FormMessage";
import { GitHubSignInButton } from "@/components/auth/GitHubSignInButton";
import { SignInForm } from "@/components/auth/SignInForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

export const metadata: Metadata = {
  title: "Sign in · DevStash",
};

// Error codes NextAuth appends when it redirects back to the sign-in page
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "An account with this email already exists. Sign in with your email and password.",
  AccessDenied: "Access was denied.",
  Configuration: "Sign-in is not configured correctly. Please try again later.",
};

const DEFAULT_ERROR_MESSAGE = "Unable to sign in. Please try again.";

// Results from /api/auth/verify-email
const VERIFY_ERROR_MESSAGES: Record<string, string> = {
  invalid: "This verification link is invalid or has already been used.",
  expired: "This verification link has expired. Sign in to get a new one.",
};

const DEFAULT_VERIFY_ERROR_MESSAGE = "Unable to verify your email. Please try again.";

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { callbackUrl, error, registered, verified, verifyError } = await searchParams;
  const redirectTo = safeCallbackUrl(callbackUrl);
  const errorCode = typeof error === "string" ? error : undefined;
  const verifyErrorCode = typeof verifyError === "string" ? verifyError : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Welcome back to DevStash</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {registered && (
          <FormMessage variant="success">
            Account created. Check your email for a link to verify your address.
          </FormMessage>
        )}
        {verified && (
          <FormMessage variant="success">
            Email verified. Sign in to continue.
          </FormMessage>
        )}
        {verifyErrorCode && (
          <FormMessage variant="error">
            {VERIFY_ERROR_MESSAGES[verifyErrorCode] ?? DEFAULT_VERIFY_ERROR_MESSAGE}
          </FormMessage>
        )}
        {errorCode && (
          <FormMessage variant="error">
            {AUTH_ERROR_MESSAGES[errorCode] ?? DEFAULT_ERROR_MESSAGE}
          </FormMessage>
        )}
        <GitHubSignInButton callbackUrl={redirectTo} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <SignInForm callbackUrl={redirectTo} />
      </CardContent>
      <CardFooter className="justify-center text-muted-foreground">
        Don&apos;t have an account?
        <Link href="/register" className="ml-1 text-foreground underline-offset-4 hover:underline">
          Register
        </Link>
      </CardFooter>
    </Card>
  );
}
