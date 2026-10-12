"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { PLANS, resolveHref, type BillingPeriod } from "./content";
import { PlanCard } from "./PlanCard";
import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";

const PERIODS: { value: BillingPeriod; label: string; saving?: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly", saving: "Save 25%" },
];

interface PricingProps {
  signedIn: boolean;
}

export function Pricing({ signedIn }: PricingProps) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  return (
    <section id="pricing" className="scroll-mt-16 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Pricing"
          title="Simple, developer-friendly pricing"
          lead="Start free. Upgrade when your stash outgrows it."
        />

        <Reveal className="mx-auto mb-10 w-fit">
          <div role="group" aria-label="Billing period" className="flex rounded-full border bg-card p-1">
            {PERIODS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={period === option.value}
                onClick={() => setPeriod(option.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4.5 py-2 text-sm transition-colors",
                  period === option.value
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
                {option.saving && (
                  <span className="rounded-full bg-green-500/15 px-2 py-px text-[0.72rem] font-semibold text-green-500">
                    {option.saving}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mx-auto grid max-w-205 grid-cols-1 gap-6 md:grid-cols-2">
          {PLANS.map((plan) => (
            <Reveal key={plan.name}>
              <PlanCard plan={plan} period={period} href={resolveHref(plan.cta.href, signedIn)} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
