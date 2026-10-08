"use server";

import { z } from "zod";

import {
  createItem as createItemRecord,
  deleteItem as deleteItemRecord,
  getItemKind,
  updateItem as updateItemRecord,
  type ItemDetail,
  type ItemFileData,
  type ItemKind,
} from "@/lib/db/items";
import { getEditableFields } from "@/lib/item-content";
import { isUniqueViolation } from "@/lib/prisma-errors";
import {
  getStoredContentType,
  isFileItemType,
  validateUploadFile,
  type FileItemType,
} from "@/lib/file-constraints";
import {
  copyObject,
  deleteObjectQuietly,
  finalKeyFor,
  headObject,
  isUserUploadKey,
  keyFromPublicUrl,
  publicUrlForKey,
} from "@/lib/r2";
import { getCurrentUserId } from "@/lib/session";
import {
  createItemSchema,
  itemIdSchema,
  updateItemSchema,
  URL_REQUIRED,
  type CreateItemInput,
  type UpdateItemData,
  type UpdateItemInput,
} from "@/lib/validations/items";
import type { ItemDetailData } from "@/types/items";

const NOT_SIGNED_IN = "You need to be signed in to do that.";
const NOT_FOUND = "Item not found.";
const INVALID_INPUT = "Please fix the highlighted fields.";
const GENERIC_ERROR = "Something went wrong. Please try again.";
const UPLOAD_NOT_FOUND = "The upload wasn't found. Please choose the file again.";
const INVALID_UPLOAD = "This file can't be used for this item type.";

export type ItemMutationResult =
  | { success: true; data: ItemDetailData }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export type UpdateItemResult = ItemMutationResult;
export type CreateItemResult = ItemMutationResult;

function toItemDetailData(item: ItemDetail): ItemDetailData {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

// Deletes the user's own pending upload, so a failed create doesn't leave it
// behind until the lifecycle rule runs. Pending keys are never stored on an
// item, so this can't break one; another user's key is ignored.
async function discardUpload(userId: string, fileKey: unknown): Promise<void> {
  if (typeof fileKey !== "string" || !isUserUploadKey(userId, fileKey)) return;
  await deleteObjectQuietly(fileKey);
}

type FileResolution = { file: ItemFileData } | { error: string };

// Checks a pending upload against the item type's rules, reading its real size
// and type from R2 rather than trusting the client
async function resolveUpload(
  userId: string,
  type: FileItemType,
  pendingKey: string,
): Promise<FileResolution> {
  if (!isUserUploadKey(userId, pendingKey)) return { error: UPLOAD_NOT_FOUND };

  const stored = await headObject(pendingKey);
  if (!stored) return { error: UPLOAD_NOT_FOUND };

  const fileName = stored.originalName ?? pendingKey.slice(pendingKey.lastIndexOf("/") + 1);
  const error = validateUploadFile(type, {
    name: fileName,
    size: stored.size,
    type: stored.contentType ?? "",
  });
  // The key's extension must match too, since the stored type came from it
  if (error || getStoredContentType(type, pendingKey) !== stored.contentType) {
    return { error: error ?? INVALID_UPLOAD };
  }

  const fileUrl = publicUrlForKey(finalKeyFor(pendingKey));
  return { file: { fileUrl, fileName, fileSize: stored.size } };
}

// Validates the pending upload and copies it to its final key, out of reach of
// the pending/ lifecycle rule
async function attachUpload(
  userId: string,
  type: FileItemType,
  pendingKey: string,
): Promise<FileResolution> {
  const resolved = await resolveUpload(userId, type, pendingKey);
  if ("file" in resolved) await copyObject(pendingKey, finalKeyFor(pendingKey));
  return resolved;
}

export async function createItem(data: CreateItemInput): Promise<CreateItemResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const parsed = createItemSchema.safeParse(data);
  if (!parsed.success) {
    await discardUpload(userId, (data as { fileKey?: unknown } | null)?.fileKey);
    return {
      success: false,
      error: INVALID_INPUT,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { fileKey, ...itemData } = parsed.data;
  const { type } = itemData;
  const uploadKey = isFileItemType(type) ? fileKey : null;
  let finalKey: string | null = null;
  try {
    let file: ItemFileData | null = null;
    if (isFileItemType(type) && uploadKey) {
      const attached = await attachUpload(userId, type, uploadKey);
      if ("error" in attached) {
        await discardUpload(userId, uploadKey);
        return { success: false, error: attached.error, fieldErrors: { file: [attached.error] } };
      }
      file = attached.file;
      finalKey = finalKeyFor(uploadKey);
    }

    const item = await createItemRecord(userId, itemData, file);
    if (!item) throw new Error(`System item type "${type}" not found`);
    await discardUpload(userId, uploadKey);
    return { success: true, data: toItemDetailData(item) };
  } catch (error) {
    await discardUpload(userId, uploadKey);
    // Another create already attached this upload; its file must stay
    if (isUniqueViolation(error)) return { success: false, error: UPLOAD_NOT_FOUND };

    console.error("Item create failed", error);
    if (finalKey) await deleteObjectQuietly(finalKey);
    return { success: false, error: GENERIC_ERROR };
  }
}

// Keeps only the type-specific fields the item's type uses, so a stray value is
// never stored; title, description and tags always apply
function fieldsForItemType(
  { content, language, url, ...rest }: UpdateItemData,
  item: ItemKind,
): UpdateItemData {
  const fields = getEditableFields(item);
  return {
    ...rest,
    ...(fields.content && { content }),
    ...(fields.language && { language }),
    ...(fields.url && { url }),
  };
}

export async function updateItem(
  itemId: string,
  data: UpdateItemInput,
): Promise<UpdateItemResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  if (typeof itemId !== "string" || !itemId) {
    return { success: false, error: NOT_FOUND };
  }

  const parsed = updateItemSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: INVALID_INPUT,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    // Scoped to the owner, so another user's item is reported as missing
    const kind = await getItemKind(userId, itemId);
    if (!kind) return { success: false, error: NOT_FOUND };

    // A link can't be left without a URL (undefined leaves the stored one)
    if (kind.contentType === "URL" && parsed.data.url === null) {
      return { success: false, error: INVALID_INPUT, fieldErrors: { url: [URL_REQUIRED] } };
    }

    const item = await updateItemRecord(userId, itemId, fieldsForItemType(parsed.data, kind));
    if (!item) return { success: false, error: NOT_FOUND };

    return { success: true, data: toItemDetailData(item) };
  } catch (error) {
    console.error("Item update failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
}

export type DeleteItemResult = { success: true } | { success: false; error: string };

export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const parsed = itemIdSchema.safeParse(itemId);
  if (!parsed.success) return { success: false, error: NOT_FOUND };

  try {
    // Scoped to the owner, so another user's item is reported as missing
    const deleted = await deleteItemRecord(userId, parsed.data);
    if (!deleted) return { success: false, error: NOT_FOUND };

    // The item is already gone, so a failed R2 delete is only logged
    const fileKey = deleted.fileUrl ? keyFromPublicUrl(deleted.fileUrl) : null;
    if (fileKey) await deleteObjectQuietly(fileKey);
    return { success: true };
  } catch (error) {
    console.error("Item delete failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
}
