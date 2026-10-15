import { jsonResponse, rateLimitedResponse } from "@/lib/api-response";
import { createPortalUrl } from "@/lib/billing";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCurrentUserId } from "@/lib/session";

interface PortalResponse {
  success: boolean;
  data?: { url: string };
  error?: string;
}

const respond = jsonResponse<PortalResponse>;

// Opens the Stripe Customer Portal. The proxy doesn't cover /api, so this checks the session itself.
export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return respond({ success: false, error: "Unauthorized" }, 401);

  const limit = await checkRateLimit("billing", userId);
  if (!limit.success) return rateLimitedResponse(limit.reset);

  try {
    const url = await createPortalUrl(userId);
    if (!url) return respond({ success: false, error: "No billing account found." }, 400);
    return respond({ success: true, data: { url } }, 200);
  } catch (error) {
    console.error("Stripe portal failed", error);
    return respond({ success: false, error: "Couldn't open billing. Please try again." }, 500);
  }
}
