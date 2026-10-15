import { cache } from "react";

import { auth } from "@/auth";

// Cached per request, since the dashboard page and sidebar both need it
export const getSession = cache(auth);

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}

export interface CurrentUser {
  id: string;
  isPro: boolean;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  const id = session?.user?.id;
  return id ? { id, isPro: session.user.isPro ?? false } : null;
}
