import type { ReactNode } from "react";

import { formatShortDateWithYear } from "@/lib/format-date";

interface FavoriteRowProps {
  icon: ReactNode;
  title: string;
  badge: string;
  date: Date;
}

// The contents of one dense favorites row: icon, title, type badge and date
export function FavoriteRow({ icon, title, badge, date }: FavoriteRowProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-1.5">
      <span className="flex shrink-0 items-center">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{title}</span>
      <span className="shrink-0 rounded border border-border/60 px-1.5 text-[11px] leading-4 text-muted-foreground">
        {badge}
      </span>
      <time
        dateTime={date.toISOString()}
        className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground sm:block"
      >
        {formatShortDateWithYear(date)}
      </time>
    </div>
  );
}
