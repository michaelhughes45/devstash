import { describe, expect, it } from "vitest";

import { checkoutSchema } from "@/lib/validations/billing";

describe("checkoutSchema", () => {
  it("accepts the monthly and yearly plans", () => {
    expect(checkoutSchema.safeParse({ plan: "monthly" }).success).toBe(true);
    expect(checkoutSchema.safeParse({ plan: "yearly" }).success).toBe(true);
  });

  it("rejects price IDs, other strings and a missing plan", () => {
    expect(checkoutSchema.safeParse({ plan: "price_1Abc" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ plan: "lifetime" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ plan: "Monthly" }).success).toBe(false);
    expect(checkoutSchema.safeParse({}).success).toBe(false);
  });
});
