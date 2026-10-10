"use client";

import { Copy, Pencil, Pin, Star } from "lucide-react";

import { toggleItemFavorite } from "@/actions/items";
import { DeleteItemDialog } from "@/components/items/DeleteItemDialog";
import { Button } from "@/components/ui/button";
import { useFavoriteToggle } from "@/hooks/use-favorite-toggle";
import { copyToClipboard } from "@/lib/clipboard";
import { getItemCopyText } from "@/lib/item-content";
import type { ItemDetailData } from "@/types/items";

interface ItemDrawerActionsProps {
  // null while the item is loading or failed to load
  item: ItemDetailData | null;
  onEdit: () => void;
  onDeleted: () => void;
  onFavoriteChange: (itemId: string, isFavorite: boolean) => void;
}

// Labels collapse to icons on narrow screens so the bar fits on one line
function ActionLabel({ children }: { children: string }) {
  return <span className="max-sm:sr-only">{children}</span>;
}

// Pin shows state only; its behavior comes in the pinned spec
export function ItemDrawerActions({
  item,
  onEdit,
  onDeleted,
  onFavoriteChange,
}: ItemDrawerActionsProps) {
  const copyText = item ? getItemCopyText(item) : null;
  const favorite = useFavoriteToggle({
    isFavorite: item?.isFavorite ?? false,
    save: (isFavorite) => toggleItemFavorite(item?.id ?? "", isFavorite),
    onSaved: (isFavorite) => item && onFavoriteChange(item.id, isFavorite),
  });

  function handleCopy() {
    if (copyText) void copyToClipboard(copyText);
  }

  return (
    <div className="flex items-center gap-1 border-b px-4 pb-4">
      <Button
        variant="ghost"
        disabled={!item || favorite.pending}
        onClick={favorite.toggle}
        aria-pressed={favorite.isFavorite}
        className={favorite.isFavorite ? "text-yellow-400 hover:text-yellow-400" : undefined}
      >
        <Star className={favorite.isFavorite ? "fill-yellow-400" : undefined} />
        <ActionLabel>Favorite</ActionLabel>
      </Button>
      <Button variant="ghost" disabled={!item} aria-pressed={item?.isPinned ?? false}>
        <Pin className={item?.isPinned ? "fill-current" : undefined} />
        <ActionLabel>Pin</ActionLabel>
      </Button>
      <Button variant="ghost" disabled={!copyText} onClick={handleCopy}>
        <Copy />
        <ActionLabel>Copy</ActionLabel>
      </Button>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" disabled={!item} onClick={onEdit}>
          <Pencil />
          <ActionLabel>Edit</ActionLabel>
        </Button>
        <DeleteItemDialog item={item} onDeleted={onDeleted} />
      </div>
    </div>
  );
}
