"use client";

import { useActionState } from "react";
import Link from "next/link";

import { resetPasswordWithToken, type ResetPasswordState } from "@/actions/auth";
import { FormField } from "@/components/auth/FormField";
import { FormMessage } from "@/components/auth/FormMessage";
import { Button } from "@/components/ui/button";
import { useRateLimitToast } from "@/hooks/use-rate-limit-toast";

interface ResetPasswordFormProps {
  token: string;
}

const INITIAL_STATE: ResetPasswordState = { success: false };

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, formAction, pending] = useActionState(
    resetPasswordWithToken,
    INITIAL_STATE,
  );
  useRateLimitToast(state);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      {state.error && (
        <FormMessage variant="error">
          {state.error}
          {state.linkError && (
            <>
              {" "}
              <Link href="/forgot-password" className="underline underline-offset-4">
                Request a new link
              </Link>
            </>
          )}
        </FormMessage>
      )}
      <FormField
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        errors={state.fieldErrors?.password}
        required
      />
      <FormField
        name="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        errors={state.fieldErrors?.confirmPassword}
        required
      />
      <Button type="submit" className="w-full" disabled={pending || state.linkError}>
        {pending ? "Updating password…" : "Update password"}
      </Button>
    </form>
  );
}
