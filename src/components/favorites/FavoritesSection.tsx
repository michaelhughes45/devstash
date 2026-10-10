import type { ReactNode } from "react";

interface FavoritesSectionProps {
  title: string;
  count: number;
  emptyText: string;
  children: ReactNode;
}

export function FavoritesSection({ title, count, emptyText, children }: FavoritesSectionProps) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="flex items-baseline gap-2 px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
        <span className="font-normal">{count}</span>
      </h2>
      {count > 0 ? (
        <ul className="divide-y divide-border/40 border-y border-border/40">{children}</ul>
      ) : (
        <p className="px-3 py-1.5 text-muted-foreground">{emptyText}</p>
      )}
    </section>
  );
}
