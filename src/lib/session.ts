import { cache } from "react";

import { auth } from "@/auth";

// Cached per request, since the dashboard page and sidebar both need it
export const getSession = cache(auth);

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}
