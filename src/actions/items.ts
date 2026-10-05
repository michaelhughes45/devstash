"use server";

import { z } from "zod";

import {
  createItem as createItemRecord,
  deleteItem as deleteItemRecord,
  updateItem as updateItemRecord,
  type ItemDetail,
} from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/session";
import {
  createItemSchema,
  itemIdSchema,
  updateItemSchema,
  type CreateItemInput,
  type UpdateItemInput,
} from "@/lib/validations/items";
import type { ItemDetailData } from "@/types/items";

const NOT_SIGNED_IN = "You need to be signed in to do that.";
const NOT_FOUND = "Item not found.";
const INVALID_INPUT = "Please fix the highlighted fields.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

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

export async function createItem(data: CreateItemInput): Promise<CreateItemResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const parsed = createItemSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: INVALID_INPUT,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const item = await createItemRecord(userId, parsed.data);
    if (!item) {
      console.error(`System item type "${parsed.data.type}" not found`);
      return { success: false, error: GENERIC_ERROR };
    }
    return { success: true, data: toItemDetailData(item) };
  } catch (error) {
    console.error("Item create failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
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
    const item = await updateItemRecord(userId, itemId, parsed.data);
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
    return deleted ? { success: true } : { success: false, error: NOT_FOUND };
  } catch (error) {
    console.error("Item delete failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
}
