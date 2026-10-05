import { z } from "zod";

import { safeExternalUrl } from "@/lib/item-content";

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_CONTENT_LENGTH = 100_000;
const MAX_LANGUAGE_LENGTH = 50;
const MAX_URL_LENGTH = 2048;
const MAX_TAG_LENGTH = 50;
const MAX_TAGS = 20;

// Blank values clear the field; undefined leaves it unchanged
function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}

export const updateItemSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(1, "Title is required")
    .max(MAX_TITLE_LENGTH, "Title is too long"),
  description: z
    .string()
    .trim()
    .max(MAX_DESCRIPTION_LENGTH, "Description is too long")
    .transform(emptyToNull)
    .nullable()
    .optional(),
  // Not trimmed, so code keeps its indentation; whitespace-only clears it
  content: z
    .string()
    .max(MAX_CONTENT_LENGTH, "Content is too long")
    .transform((value) => (value.trim() === "" ? null : value))
    .nullable()
    .optional(),
  language: z
    .string()
    .trim()
    .max(MAX_LANGUAGE_LENGTH, "Language is too long")
    .transform(emptyToNull)
    .nullable()
    .optional(),
  // Only http(s), matching what the drawer will render as a link
  url: z
    .string()
    .trim()
    .max(MAX_URL_LENGTH, "URL is too long")
    .refine((value) => value === "" || safeExternalUrl(value) !== null, {
      error: "Enter a valid http or https URL",
    })
    .transform(emptyToNull)
    .nullable()
    .optional(),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Tags can't be empty")
        .max(MAX_TAG_LENGTH, `Tags can be at most ${MAX_TAG_LENGTH} characters`),
    )
    .max(MAX_TAGS, `Use at most ${MAX_TAGS} tags`)
    .transform((tags) => [...new Set(tags)]),
});

export type UpdateItemInput = z.input<typeof updateItemSchema>;
export type UpdateItemData = z.output<typeof updateItemSchema>;
