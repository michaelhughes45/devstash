import type { ComponentProps, ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormFieldProps extends ComponentProps<typeof Input> {
  name: string;
  label: string;
  labelAddon?: ReactNode;
  errors?: string[];
}

export function FormField({ name, label, labelAddon, errors, ...inputProps }: FormFieldProps) {
  const error = errors?.[0];
  const errorId = `${name}-error`;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={name}>{label}</Label>
        {labelAddon}
      </div>
      <Input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
