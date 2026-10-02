"use client";

import { useActionState } from "react";

import { requestPasswordReset, type ForgotPasswordState } from "@/actions/auth";
import { FormField } from "@/components/auth/FormField";
import { FormMessage } from "@/components/auth/FormMessage";
import { Button } from "@/components/ui/button";

const INITIAL_STATE: ForgotPasswordState = { success: false };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    INITIAL_STATE,
  );

  if (state.success) {
    return (
      <FormMessage variant="success">
        If an account exists for {state.email}, we&apos;ve sent a link to reset your
        password. It expires in 1 hour.
      </FormMessage>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      {/* Remount so the submitted email survives React's post-action form reset */}
      <FormField
        key={state.email}
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        defaultValue={state.email}
        errors={state.fieldErrors?.email}
        required
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
