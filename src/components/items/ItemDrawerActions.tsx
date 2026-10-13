"use client";

import { Copy, Pencil, Pin, Star } from "lucide-react";

import { toggleItemFavorite, toggleItemPin } from "@/actions/items";
import { DeleteItemDialog } from "@/components/items/DeleteItemDialog";
import { Button } from "@/components/ui/button";
import { useFavoriteToggle } from "@/hooks/use-favorite-toggle";
import { usePinToggle } from "@/hooks/use-pin-toggle";
import { copyToClipboard } from "@/lib/clipboard";
import { getItemCopyText } from "@/lib/item-content";
import { cn } from "@/lib/utils";
import type { ItemDetailData, ItemFlags } from "@/types/items";

interface ItemDrawerActionsProps {
  // null while the item is loading or failed to load
  item: ItemDetailData | null;
  onEdit: () => void;
  onDeleted: () => void;
  onFlagsChange: (itemId: string, flags: ItemFlags) => void;
}

// Labels collapse to icons on narrow screens so the bar fits on one line; the icon
// buttons grow there to stay easy to tap
const TOUCH_SIZE = "max-sm:size-10";

function ActionLabel({ children }: { children: string }) {
  return <span className="max-sm:sr-only">{children}</span>;
}

export function ItemDrawerActions({
  item,
  onEdit,
  onDeleted,
  onFlagsChange,
}: ItemDrawerActionsProps) {
  const copyText = item ? getItemCopyText(item) : null;
  const favorite = useFavoriteToggle({
    isFavorite: item?.isFavorite ?? false,
    save: (isFavorite) => toggleItemFavorite(item?.id ?? "", isFavorite),
    onSaved: (isFavorite) => item && onFlagsChange(item.id, { isFavorite }),
  });
  const pin = usePinToggle({
    isPinned: item?.isPinned ?? false,
    save: (isPinned) => toggleItemPin(item?.id ?? "", isPinned),
    onSaved: (isPinned) => item && onFlagsChange(item.id, { isPinned }),
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
        className={cn(
          TOUCH_SIZE,
          favorite.isFavorite && "text-yellow-400 hover:text-yellow-400",
        )}
      >
        <Star className={favorite.isFavorite ? "fill-yellow-400" : undefined} />
        <ActionLabel>Favorite</ActionLabel>
      </Button>
      <Button
        variant="ghost"
        disabled={!item || pin.pending}
        onClick={pin.toggle}
        aria-pressed={pin.isPinned}
        className={cn(
          TOUCH_SIZE,
          pin.isPinned && "bg-sky-400/10 text-sky-400 hover:bg-sky-400/15 hover:text-sky-400",
        )}
      >
        <Pin className={pin.isPinned ? "fill-current" : undefined} />
        <ActionLabel>Pin</ActionLabel>
      </Button>
      <Button variant="ghost" disabled={!copyText} onClick={handleCopy} className={TOUCH_SIZE}>
        <Copy />
        <ActionLabel>Copy</ActionLabel>
      </Button>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" disabled={!item} onClick={onEdit} className={TOUCH_SIZE}>
          <Pencil />
          <ActionLabel>Edit</ActionLabel>
        </Button>
        <DeleteItemDialog item={item} onDeleted={onDeleted} triggerClassName={TOUCH_SIZE} />
      </div>
    </div>
  );
}
