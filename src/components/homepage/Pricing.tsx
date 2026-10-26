"use client";

import { useState } from "react";
import Link from "next/link";

import { BillingPeriodToggle } from "./BillingPeriodToggle";
import { PLANS, resolveHref, type BillingPeriod } from "./content";
import { PlanCard, planButtonClass } from "./PlanCard";
import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";

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
          <BillingPeriodToggle value={period} onChange={setPeriod} />
        </Reveal>

        <div className="mx-auto grid max-w-205 grid-cols-1 gap-6 md:grid-cols-2">
          {PLANS.map((plan) => (
            <Reveal key={plan.name}>
              <PlanCard
                plan={plan}
                period={period}
                action={
                  <Link
                    href={resolveHref(plan.cta.href, signedIn)}
                    className={planButtonClass(plan)}
                  >
                    {(signedIn && plan.cta.signedInLabel) || plan.cta.label}
                  </Link>
                }
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
