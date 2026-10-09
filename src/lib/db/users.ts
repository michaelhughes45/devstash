import {
  parseEditorPreferences,
  type EditorPreferences,
} from "@/lib/editor-preferences";
import { prisma } from "@/lib/prisma";
import { isRecordNotFound } from "@/lib/prisma-errors";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  // Email/password users can change their password; OAuth-only users can't
  hasPassword: boolean;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      password: true,
    },
  });
  if (!user) return null;

  // The hash never leaves this function
  const { password, ...profile } = user;
  return { ...profile, hasPassword: password !== null };
}

// Defaults for anything not saved yet
export async function getEditorPreferences(userId: string): Promise<EditorPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { editorPreferences: true },
  });
  return parseEditorPreferences(user?.editorPreferences);
}

// Null when the user no longer exists
export async function updateEditorPreferences(
  userId: string,
  preferences: EditorPreferences,
): Promise<EditorPreferences | null> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { editorPreferences: { ...preferences } },
      select: { editorPreferences: true },
    });
    return parseEditorPreferences(user.editorPreferences);
  } catch (error) {
    if (isRecordNotFound(error)) return null;
    throw error;
  }
}
