import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

import { MINI_DASHBOARD_CARD_COLORS, MINI_DASHBOARD_TYPES } from "./content";

// Fewer cards on phones, where the panel is shorter
const MOBILE_CARD_COUNT = 4;

function typeColor(color: string): CSSProperties {
  return { "--type-color": color } as CSSProperties;
}

// A decorative preview of the app: sidebar of item types and a grid of cards
export function MiniDashboard() {
  return (
    <div
      aria-hidden="true"
      className="grid h-48 grid-cols-[104px_1fr] overflow-hidden rounded-lg border bg-background md:h-75"
    >
      <div className="flex flex-col gap-1 overflow-hidden border-r px-2.5 py-3 md:gap-1.5">
        <div className="mb-2 h-2.5 w-3/5 rounded bg-linear-to-r from-blue-500 to-violet-600" />
        {MINI_DASHBOARD_TYPES.map((type) => (
          <div
            key={type.label}
            style={typeColor(type.color)}
            className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground"
          >
            <span className="size-2 shrink-0 rounded-xs bg-(--type-color)" />
            {type.label}
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-col gap-3 p-3">
        <div className="h-5.5 rounded-md border bg-card" />
        <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-2.5">
          {MINI_DASHBOARD_CARD_COLORS.map((color, index) => (
            <div
              key={color}
              style={typeColor(color)}
              className={cn(
                "flex flex-col gap-1.5 rounded-md border border-t-3 border-t-(--type-color) bg-card p-2.5",
                index >= MOBILE_CARD_COUNT && "max-md:hidden",
              )}
            >
              <i className="h-1.5 w-[70%] rounded-full bg-[color-mix(in_oklch,var(--type-color)_45%,var(--muted))]" />
              <i className="h-1.5 rounded-full bg-muted" />
              <i className="h-1.5 w-1/2 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
