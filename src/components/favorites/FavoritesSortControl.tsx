import { FAVORITE_SORT_LABELS, FAVORITE_SORTS, type FavoriteSort } from "@/lib/favorites-sort";
import { cn } from "@/lib/utils";

interface FavoritesSortControlProps {
  value: FavoriteSort;
  onChange: (sort: FavoriteSort) => void;
}

export function FavoritesSortControl({ value, onChange }: FavoritesSortControlProps) {
  return (
    <div role="group" aria-label="Sort favorites" className="flex items-center gap-1 px-3 text-xs">
      <span className="mr-1 text-muted-foreground">sort:</span>
      {FAVORITE_SORTS.map((sort) => (
        <button
          key={sort}
          type="button"
          aria-pressed={value === sort}
          onClick={() => onChange(sort)}
          className={cn(
            "rounded border px-2 py-0.5 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            value === sort
              ? "border-border bg-muted text-foreground"
              : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground",
          )}
        >
          {FAVORITE_SORT_LABELS[sort].toLowerCase()}
        </button>
      ))}
    </div>
  );
}
