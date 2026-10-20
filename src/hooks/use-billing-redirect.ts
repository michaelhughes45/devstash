"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { BillingPlan } from "@/lib/validations/billing";

export type BillingAction = BillingPlan | "portal";

interface BillingResponse {
  success: boolean;
  data?: { url: string };
  error?: string;
}

const GENERIC_ERROR = "Something went wrong. Please try again.";

// Both routes answer with a Stripe-hosted URL to send the user to
async function requestBillingUrl(action: BillingAction): Promise<string> {
  const response =
    action === "portal"
      ? await fetch("/api/stripe/portal", { method: "POST" })
      : await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: action }),
        });
  const body = (await response.json().catch(() => null)) as BillingResponse | null;
  if (!response.ok || !body?.data?.url) throw new Error(body?.error ?? GENERIC_ERROR);
  return body.data.url;
}

// Sends the user to Stripe Checkout or the billing portal; `pending` is the action in flight
export function useBillingRedirect() {
  const [pending, setPending] = useState<BillingAction | null>(null);

  async function start(action: BillingAction) {
    setPending(action);
    try {
      // Stays pending while the browser leaves for Stripe
      window.location.assign(await requestBillingUrl(action));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : GENERIC_ERROR);
      setPending(null);
    }
  }

  return { pending, start };
}
