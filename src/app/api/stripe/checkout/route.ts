import { jsonResponse, rateLimitedResponse } from "@/lib/api-response";
import { createCheckoutUrl } from "@/lib/billing";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCurrentUserId } from "@/lib/session";
import { checkoutSchema } from "@/lib/validations/billing";

interface CheckoutResponse {
  success: boolean;
  data?: { url: string };
  error?: string;
}

const respond = jsonResponse<CheckoutResponse>;

// Starts a hosted Stripe Checkout for Pro. The proxy doesn't cover /api, so this checks the session itself.
export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return respond({ success: false, error: "Unauthorized" }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond({ success: false, error: "Invalid request." }, 400);
  }
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return respond({ success: false, error: "Choose a plan." }, 400);

  // Checked after validation, so a bad request doesn't use up an attempt
  const limit = await checkRateLimit("billing", userId);
  if (!limit.success) return rateLimitedResponse(limit.reset);

  try {
    const result = await createCheckoutUrl(userId, parsed.data.plan);
    if ("error" in result) {
      return result.error === "already-pro"
        ? respond({ success: false, error: "You're already on Pro." }, 409)
        : respond({ success: false, error: "Unauthorized" }, 401);
    }
    return respond({ success: true, data: { url: result.url } }, 200);
  } catch (error) {
    console.error("Stripe checkout failed", error);
    return respond({ success: false, error: "Couldn't start checkout. Please try again." }, 500);
  }
}
