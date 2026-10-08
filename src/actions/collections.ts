"use server";

import { createCollection as createCollectionRecord } from "@/lib/db/collections";
import { getCurrentUserId } from "@/lib/session";
import {
  createCollectionSchema,
  type CreateCollectionInput,
} from "@/lib/validations/collections";
import { fieldErrorsOf } from "@/lib/validations/field-errors";
import type { CollectionData } from "@/types/collections";
import type { FieldErrors } from "@/types/forms";

const NOT_SIGNED_IN = "You need to be signed in to do that.";
const INVALID_INPUT = "Please fix the highlighted fields.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

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
