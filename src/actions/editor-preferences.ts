"use server";

import { updateEditorPreferences as updateEditorPreferencesRecord } from "@/lib/db/users";
import { editorPreferencesSchema, type EditorPreferences } from "@/lib/editor-preferences";
import { getCurrentUserId } from "@/lib/session";

const NOT_SIGNED_IN = "You need to be signed in to do that.";
const INVALID_INPUT = "Those editor settings aren't valid.";
const GENERIC_ERROR = "Couldn't save your editor settings. Please try again.";

export type UpdateEditorPreferencesResult =
  | { success: true; data: EditorPreferences }
  | { success: false; error: string };

export async function updateEditorPreferences(
  data: unknown,
): Promise<UpdateEditorPreferencesResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const parsed = editorPreferencesSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: INVALID_INPUT };

  try {
    const preferences = await updateEditorPreferencesRecord(userId, parsed.data);
    if (!preferences) return { success: false, error: NOT_SIGNED_IN };
    return { success: true, data: preferences };
  } catch (error) {
    console.error("Editor preferences update failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
}
