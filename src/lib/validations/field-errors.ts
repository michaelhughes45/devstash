import { z } from "zod";

import type { FieldErrors } from "@/types/forms";

// Per-field messages from a failed safeParse
export function fieldErrorsOf(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors;
}
