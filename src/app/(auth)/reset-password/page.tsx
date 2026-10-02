import type { Metadata } from "next";
import Link from "next/link";

import { FormMessage } from "@/components/auth/FormMessage";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { checkPasswordResetToken, RESET_LINK_ERRORS } from "@/lib/password-reset";

export const metadata: Metadata = {
  title: "Reset password · DevStash",
  // Keeps the token in the URL out of the Referer header
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  const resetToken = typeof token === "string" ? token : "";
  const status = resetToken ? await checkPasswordResetToken(resetToken) : "invalid";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Reset your password</CardTitle>
        <CardDescription>Choose a new password for your account</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "valid" ? (
          <ResetPasswordForm token={resetToken} />
        ) : (
          <FormMessage variant="error">
            {RESET_LINK_ERRORS[status]}{" "}
            <Link href="/forgot-password" className="underline underline-offset-4">
              Request a new link
            </Link>
          </FormMessage>
        )}
      </CardContent>
      <CardFooter className="justify-center text-muted-foreground">
        <Link href="/sign-in" className="text-foreground underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
