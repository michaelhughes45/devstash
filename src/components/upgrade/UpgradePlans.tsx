"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { BillingPeriodToggle } from "@/components/homepage/BillingPeriodToggle";
import { PLANS, type BillingPeriod, type Plan } from "@/components/homepage/content";
import { PlanCard, planButtonClass } from "@/components/homepage/PlanCard";
import { useBillingRedirect } from "@/hooks/use-billing-redirect";

const UPGRADE_LABELS: Record<BillingPeriod, string> = {
  monthly: "Upgrade — $8/month",
  yearly: "Upgrade — $72/year",
};

// Plans with a billing period toggle; the Pro button starts Checkout for the chosen period
export function UpgradePlans() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const { pending, start } = useBillingRedirect();

  function actionFor(plan: Plan) {
    if (!plan.highlight) {
      return (
        <button type="button" disabled className={planButtonClass(plan)}>
          Current plan
        </button>
      );
    }
    return (
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => start(period)}
        className={planButtonClass(plan)}
      >
        {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {UPGRADE_LABELS[period]}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-10">
      <BillingPeriodToggle value={period} onChange={setPeriod} />
      <div className="grid w-full max-w-205 grid-cols-1 gap-6 md:grid-cols-2">
        {PLANS.map((plan) => (
          <PlanCard key={plan.name} plan={plan} period={period} action={actionFor(plan)} />
        ))}
      </div>
    </div>
  );
}
