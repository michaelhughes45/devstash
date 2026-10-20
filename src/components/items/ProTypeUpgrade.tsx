"use client";

import { Loader2 } from "lucide-react";

import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBillingRedirect } from "@/hooks/use-billing-redirect";
import type { BillingPlan } from "@/lib/validations/billing";

interface ProTypeUpgradeProps {
  // Display name, e.g. "Files"
  name: string;
  icon: string;
  color: string;
  description: string;
}

const PLAN_BUTTONS: { plan: BillingPlan; label: string; variant: "default" | "outline" }[] = [
  { plan: "monthly", label: "Upgrade — $8/month", variant: "default" },
  { plan: "yearly", label: "Upgrade — $72/year (save 25%)", variant: "outline" },
];

// Shown to free users on a Pro-only type's page in place of its (empty) list
export function ProTypeUpgrade({ name, icon, color, description }: ProTypeUpgradeProps) {
  const { pending, start } = useBillingRedirect();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <div
        className="flex size-14 items-center justify-center rounded-full bg-muted"
        style={{ color }}
      >
        <ItemTypeIcon icon={icon} className="size-6" aria-hidden />
      </div>
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">{name}</h1>
        <Badge>Pro</Badge>
      </div>
      <p className="text-pretty text-muted-foreground">{description}</p>
      <p className="text-sm text-muted-foreground">
        Upgrade to Pro to unlock {name.toLowerCase().replace(/s$/, "")} uploads and storage.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {PLAN_BUTTONS.map(({ plan, label, variant }) => (
          <Button
            key={plan}
            type="button"
            variant={variant}
            disabled={pending !== null}
            onClick={() => start(plan)}
          >
            {pending === plan && <Loader2 className="animate-spin" aria-hidden="true" />}
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
