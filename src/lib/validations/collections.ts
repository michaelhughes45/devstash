import { z } from "zod";

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

export const createCollectionSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(MAX_NAME_LENGTH, "Name is too long"),
  // Blank saves as null
  description: z
    .string()
    .trim()
    .max(MAX_DESCRIPTION_LENGTH, "Description is too long")
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional()
    .transform((value) => value ?? null),
});

export type CreateCollectionInput = z.input<typeof createCollectionSchema>;
export type CreateCollectionData = z.output<typeof createCollectionSchema>;
