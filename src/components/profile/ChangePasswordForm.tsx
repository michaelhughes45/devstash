"use client";

import { useActionState } from "react";

import { changePassword, type ChangePasswordState } from "@/actions/profile";
import { FormField } from "@/components/auth/FormField";
import { FormMessage } from "@/components/auth/FormMessage";
import { Button } from "@/components/ui/button";

const INITIAL_STATE: ChangePasswordState = { success: false };

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, INITIAL_STATE);

  return (
    <form action={formAction} className="grid max-w-sm gap-4">
      {state.success && <FormMessage variant="success">Password updated.</FormMessage>}
      {state.error && <FormMessage variant="error">{state.error}</FormMessage>}
      <FormField
        name="currentPassword"
        label="Current password"
        type="password"
        autoComplete="current-password"
        errors={state.fieldErrors?.currentPassword}
        required
      />
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
      <Button type="submit" className="w-fit" disabled={pending}>
        {pending ? "Updating password…" : "Update password"}
      </Button>
    </form>
  );
}
