import type { ItemDetailData } from "@/types/items";

interface ItemDetailResponse {
  success: boolean;
  data?: ItemDetailData;
  error?: string;
}

// Loads an item from GET /api/items/[id] in the browser; throws with the route's
// error message on 401, 404 or a failed request
export async function fetchItemDetail(id: string, signal?: AbortSignal): Promise<ItemDetailData> {
  const response = await fetch(`/api/items/${encodeURIComponent(id)}`, { signal });
  const body = (await response.json().catch(() => null)) as ItemDetailResponse | null;
  if (!response.ok || !body?.success || !body.data) {
    throw new Error(body?.error ?? "Failed to load item");
  }
  return body.data;
}
