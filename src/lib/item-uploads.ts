import type { ItemFileData } from "@/lib/db/items";
import {
  getStoredContentType,
  validateUploadFile,
  type FileItemType,
} from "@/lib/file-constraints";
import {
  copyObject,
  deleteObjectQuietly,
  finalKeyFor,
  headObject,
  isUserUploadKey,
  publicUrlForKey,
} from "@/lib/r2";

// Server-side handling of uploads from POST /api/upload when createItem attaches
// them. Not a "use server" module, so none of this is callable as an action.

export const UPLOAD_NOT_FOUND = "The upload wasn't found. Please choose the file again.";
const INVALID_UPLOAD = "This file can't be used for this item type.";

// The upload key from createItem's raw input, before it's been validated
export function getFileKey(data: unknown): string | null {
  if (typeof data !== "object" || data === null || !("fileKey" in data)) return null;
  return typeof data.fileKey === "string" ? data.fileKey : null;
}

// Deletes the user's own pending upload, so a failed create doesn't leave it
// behind until the lifecycle rule runs. Pending keys are never stored on an
// item, so this can't break one; another user's key is ignored.
export async function discardUpload(
  userId: string,
  fileKey: string | null | undefined,
): Promise<void> {
  if (!fileKey || !isUserUploadKey(userId, fileKey)) return;
  await deleteObjectQuietly(fileKey);
}

export type FileResolution = { file: ItemFileData } | { error: string };

// Checks a pending upload against the item type's rules, reading its real size
// and type from R2 rather than trusting the client
export async function resolveUpload(
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
export async function attachUpload(
  userId: string,
  type: FileItemType,
  pendingKey: string,
): Promise<FileResolution> {
  const resolved = await resolveUpload(userId, type, pendingKey);
  if ("file" in resolved) await copyObject(pendingKey, finalKeyFor(pendingKey));
  return resolved;
}
