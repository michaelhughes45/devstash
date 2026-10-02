"use client";

import { useActionState } from "react";
import Link from "next/link";

import { signInWithCredentials, type SignInState } from "@/actions/auth";
import { FormField } from "@/components/auth/FormField";
import { FormMessage } from "@/components/auth/FormMessage";
import { Button } from "@/components/ui/button";

interface SignInFormProps {
  callbackUrl: string;
}

const INITIAL_STATE: SignInState = { success: false };

export function SignInForm({ callbackUrl }: SignInFormProps) {
  const [state, formAction, pending] = useActionState(
    signInWithCredentials,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {state.error && <FormMessage variant="error">{state.error}</FormMessage>}
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
      <FormField
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        labelAddon={
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        }
        errors={state.fieldErrors?.password}
        required
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
