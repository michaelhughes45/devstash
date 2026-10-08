"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { FormField } from "@/components/auth/FormField";
import { FormMessage } from "@/components/auth/FormMessage";
import { Button } from "@/components/ui/button";
import { registerSchema } from "@/lib/validations/auth";
import { fieldErrorsOf } from "@/lib/validations/field-errors";
import type { FieldErrors } from "@/types/forms";

interface RegisterResponse {
  success: boolean;
  error?: string;
  fieldErrors?: FieldErrors;
}

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);

    const values = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(fieldErrorsOf(parsed.error));
      return;
    }
    setFieldErrors({});
    setPending(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result: RegisterResponse = await response.json();

      if (response.status === 429) {
        toast.error(result.error ?? "Too many attempts. Please try again later.");
        setPending(false);
        return;
      }
      if (!result.success) {
        setError(result.error ?? "Registration failed");
        setFieldErrors(result.fieldErrors ?? {});
        setPending(false);
        return;
      }
      router.push("/sign-in?registered=1");
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      {error && <FormMessage variant="error">{error}</FormMessage>}
      <FormField
        name="name"
        label="Name"
        autoComplete="name"
        placeholder="Jane Doe"
        errors={fieldErrors.name}
      />
      <FormField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        errors={fieldErrors.email}
      />
      <FormField
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        errors={fieldErrors.password}
      />
      <FormField
        name="confirmPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        errors={fieldErrors.confirmPassword}
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
