import type Stripe from "stripe";

import { jsonResponse } from "@/lib/api-response";
import { handleStripeEvent } from "@/lib/billing";
import { stripe } from "@/lib/stripe";

interface WebhookResponse {
  received?: boolean;
  error?: string;
}

const respond = jsonResponse<WebhookResponse>;

// Keeps isPro and the subscription ID in sync with Stripe. There's no session:
// the signature is the authentication (the proxy doesn't cover /api)
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return respond({ error: "Missing signature." }, 400);

  // The signature covers the exact bytes Stripe sent, so the body is read as text
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return respond({ error: "Invalid signature." }, 400);
  }

  try {
    await handleStripeEvent(event);
    return respond({ received: true }, 200);
  } catch (error) {
    // A 500 makes Stripe retry; replays are safe since each event re-reads the subscription
    console.error(`Stripe webhook ${event.type} failed`, error);
    return respond({ error: "Webhook processing failed." }, 500);
  }
}
