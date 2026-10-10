"use server";

import {
  createCollection as createCollectionRecord,
  deleteCollection as deleteCollectionRecord,
  setCollectionFavorite,
  updateCollection as updateCollectionRecord,
} from "@/lib/db/collections";
import { getCurrentUserId } from "@/lib/session";
import {
  collectionIdSchema,
  createCollectionSchema,
  updateCollectionSchema,
  type CreateCollectionInput,
  type UpdateCollectionInput,
} from "@/lib/validations/collections";
import { fieldErrorsOf } from "@/lib/validations/field-errors";
import type { CollectionData, CollectionSummary } from "@/types/collections";
import type { ToggleFavoriteResult } from "@/types/favorites";
import type { FieldErrors } from "@/types/forms";

const NOT_SIGNED_IN = "You need to be signed in to do that.";
const INVALID_INPUT = "Please fix the highlighted fields.";
const GENERIC_ERROR = "Something went wrong. Please try again.";
const NOT_FOUND = "Collection not found.";

export type CreateCollectionResult =
  | { success: true; data: CollectionData }
  | { success: false; error: string; fieldErrors?: FieldErrors };

export async function createCollection(
  data: CreateCollectionInput,
): Promise<CreateCollectionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const parsed = createCollectionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: INVALID_INPUT, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  try {
    const collection = await createCollectionRecord(userId, parsed.data);
    return {
      success: true,
      data: { ...collection, createdAt: collection.createdAt.toISOString() },
    };
  } catch (error) {
    console.error("Collection create failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
}

export type UpdateCollectionResult =
  | { success: true; data: CollectionSummary }
  | { success: false; error: string; fieldErrors?: FieldErrors };

export async function updateCollection(
  id: string,
  data: UpdateCollectionInput,
): Promise<UpdateCollectionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  if (!collectionIdSchema.safeParse(id).success) return { success: false, error: NOT_FOUND };

  const parsed = updateCollectionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: INVALID_INPUT, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  try {
    const collection = await updateCollectionRecord(userId, id, parsed.data);
    if (!collection) return { success: false, error: NOT_FOUND };
    return { success: true, data: collection };
  } catch (error) {
    console.error("Collection update failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
}

export type DeleteCollectionResult = { success: true } | { success: false; error: string };

// Deletes only the collection; its items are kept
export async function deleteCollection(id: string): Promise<DeleteCollectionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  if (!collectionIdSchema.safeParse(id).success) return { success: false, error: NOT_FOUND };

  try {
    const deleted = await deleteCollectionRecord(userId, id);
    return deleted ? { success: true } : { success: false, error: NOT_FOUND };
  } catch (error) {
    console.error("Collection delete failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
}

// Sets the flag to the requested value rather than flipping the stored one, so a
// double click or a stale tab ends in the state the user saw
export async function toggleCollectionFavorite(
  id: string,
  isFavorite: boolean,
): Promise<ToggleFavoriteResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  if (!collectionIdSchema.safeParse(id).success) return { success: false, error: NOT_FOUND };
  if (typeof isFavorite !== "boolean") return { success: false, error: GENERIC_ERROR };

  try {
    const saved = await setCollectionFavorite(userId, id, isFavorite);
    if (saved === null) return { success: false, error: NOT_FOUND };
    return { success: true, data: { isFavorite: saved } };
  } catch (error) {
    console.error("Collection favorite failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
}
