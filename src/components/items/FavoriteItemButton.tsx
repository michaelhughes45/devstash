"use client";

import { Star } from "lucide-react";

import { toggleItemFavorite } from "@/actions/items";
import { Button } from "@/components/ui/button";
import { useFavoriteToggle } from "@/hooks/use-favorite-toggle";
import { cn } from "@/lib/utils";

interface FavoriteItemButtonProps {
  itemId: string;
  isFavorite: boolean;
  title: string;
  className?: string;
}

// Favorite toggle for item cards; rendered beside the drawer trigger, never inside it
export function FavoriteItemButton({ itemId, isFavorite, title, className }: FavoriteItemButtonProps) {
  const favorite = useFavoriteToggle({
    isFavorite,
    save: (next) => toggleItemFavorite(itemId, next),
  });

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={favorite.toggle}
      disabled={favorite.pending}
      aria-pressed={favorite.isFavorite}
      aria-label={`Favorite ${title}`}
      title={favorite.isFavorite ? "Unfavorite" : "Favorite"}
      className={cn(
        favorite.isFavorite
          ? "text-yellow-400 hover:text-yellow-400"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <Star className={favorite.isFavorite ? "fill-yellow-400" : undefined} />
    </Button>
  );
}
