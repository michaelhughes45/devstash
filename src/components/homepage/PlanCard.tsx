import type { ReactNode } from "react";
import { Check } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { BillingPeriod, Plan } from "./content";

interface PlanCardProps {
  plan: Plan;
  period: BillingPeriod;
  // The plan's button: a link on the homepage, a checkout button on /upgrade
  action: ReactNode;
}

// Button styles for a plan's action, so links and buttons match
export function planButtonClass(plan: Plan): string {
  return cn(buttonVariants({ variant: plan.highlight ? "default" : "outline", size: "lg" }), "w-full");
}

// Presentational only (no hooks), so it renders inside the client Pricing component
export function PlanCard({ plan, period, action }: PlanCardProps) {
  const price = plan.prices[period];
  const highlighted = Boolean(plan.highlight);

  return (
    <Card
      className={cn(
        "relative h-full gap-0 overflow-visible px-6 py-7 ring-border sm:p-8",
        highlighted &&
          "bg-[linear-gradient(180deg,rgb(99_102_241/0.1),transparent_45%)] shadow-[0_30px_80px_-30px_rgb(99_102_241/0.45)] ring-2 ring-indigo-500/60",
      )}
    >
      {plan.highlight && (
        <span className="absolute -top-3.25 left-1/2 -translate-x-1/2 rounded-full bg-linear-to-r from-blue-500 to-violet-600 px-3.5 py-1 text-xs font-semibold whitespace-nowrap text-white">
          {plan.highlight}
        </span>
      )}
      <h3 className="text-xl font-semibold">{plan.name}</h3>
      <p className="mt-1.5 text-[0.95rem] text-muted-foreground">{plan.description}</p>
      <p className="mt-6 flex items-baseline gap-1">
        <span className="text-[2.75rem] leading-none font-extrabold tracking-tight">
          {price.amount}
        </span>
        <span className="text-muted-foreground">{price.period}</span>
      </p>
      <p className="mt-2 min-h-[1.6em] text-sm text-muted-foreground/70">{price.note}</p>
      <ul className="my-6 grid flex-1 content-start gap-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3 text-[0.95rem] text-muted-foreground">
            <Check className="mt-1 size-4 shrink-0 text-blue-500" strokeWidth={3} aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>
      {action}
    </Card>
  );
}
