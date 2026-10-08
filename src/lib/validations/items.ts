import { z } from "zod";

import { isFileItemType } from "@/lib/file-constraints";
import {
  CREATABLE_ITEM_TYPES,
  getCreateFields,
  safeExternalUrl,
} from "@/lib/item-content";

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_CONTENT_LENGTH = 100_000;
const MAX_LANGUAGE_LENGTH = 50;
const MAX_URL_LENGTH = 2048;
const MAX_TAG_LENGTH = 50;
const MAX_TAGS = 20;
const MAX_ID_LENGTH = 64;
const MAX_FILE_KEY_LENGTH = 200;

export const URL_REQUIRED = "URL is required";

export const itemIdSchema = z.string().min(1).max(MAX_ID_LENGTH);

// Blank values clear the field; undefined leaves it unchanged
function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}

// Field rules shared by the edit and create forms
const itemFields = {
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
};

export const updateItemSchema = z.object(itemFields);

export type UpdateItemInput = z.input<typeof updateItemSchema>;
export type UpdateItemData = z.output<typeof updateItemSchema>;

export const createItemSchema = z
  .object({
    type: z.enum(CREATABLE_ITEM_TYPES, { error: "Choose an item type" }),
    ...itemFields,
    // R2 key returned by POST /api/upload; ownership is checked by the action
    fileKey: z.string().trim().max(MAX_FILE_KEY_LENGTH).optional(),
  })
  .refine((data) => data.type !== "link" || data.url, {
    error: URL_REQUIRED,
    path: ["url"],
  })
  .refine((data) => !isFileItemType(data.type) || data.fileKey, {
    error: "Choose a file to upload",
    path: ["file"],
  })
  // Fields the type doesn't use are dropped, so a stray value is never stored
  .transform(({ type, content, language, url, fileKey, ...rest }) => {
    const fields = getCreateFields(type);
    return {
      ...rest,
      type,
      content: fields.content ? (content ?? null) : null,
      language: fields.language ? (language ?? null) : null,
      url: fields.url ? (url ?? null) : null,
      fileKey: isFileItemType(type) ? (fileKey ?? null) : null,
    };
  });

export type CreateItemInput = z.input<typeof createItemSchema>;
export type CreateItemData = z.output<typeof createItemSchema>;
