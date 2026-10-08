import { jsonResponse } from "@/lib/api-response";
import { getItemDetail, type ItemDetail } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/session";

interface ItemDetailResponse {
  success: boolean;
  data?: ItemDetail;
  error?: string;
}

const respond = jsonResponse<ItemDetailResponse>;

// The proxy doesn't cover /api, so this route checks the session itself
export async function GET(_request: Request, ctx: RouteContext<"/api/items/[id]">) {
  const userId = await getCurrentUserId();
  if (!userId) return respond({ success: false, error: "Unauthorized" }, 401);

  const { id } = await ctx.params;

  try {
    const item = await getItemDetail(userId, id);
    // Another user's item is reported as missing, so ids can't be probed
    if (!item) return respond({ success: false, error: "Item not found" }, 404);
    return respond({ success: true, data: item }, 200);
  } catch (error) {
    console.error("Failed to load item", error);
    return respond({ success: false, error: "Failed to load item" }, 500);
  }
}
