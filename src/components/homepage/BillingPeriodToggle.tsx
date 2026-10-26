import { cn } from "@/lib/utils";

import type { BillingPeriod } from "./content";

const PERIODS: { value: BillingPeriod; label: string; saving?: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly", saving: "Save 25%" },
];

interface BillingPeriodToggleProps {
  value: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}

// Presentational only (no hooks), so the client parent owns the state
export function BillingPeriodToggle({ value, onChange }: BillingPeriodToggleProps) {
  return (
    <div role="group" aria-label="Billing period" className="flex rounded-full border bg-card p-1">
      {PERIODS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4.5 py-2 text-sm transition-colors",
            value === option.value
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
  );
}
