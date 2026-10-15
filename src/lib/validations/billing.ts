import { z } from "zod";

export const BILLING_PLANS = ["monthly", "yearly"] as const;
export type BillingPlan = (typeof BILLING_PLANS)[number];

// The client sends a plan name, never a price ID
export const checkoutSchema = z.object({
  plan: z.enum(BILLING_PLANS, { error: "Choose a plan" }),
});
