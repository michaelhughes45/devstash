"use client";

import { Copy, Pencil, Pin, Star } from "lucide-react";
import { toast } from "sonner";

import { DeleteItemDialog } from "@/components/items/DeleteItemDialog";
import { Button } from "@/components/ui/button";
import { getItemCopyText } from "@/lib/item-content";
import type { ItemDetailData } from "@/types/items";

interface ItemDrawerActionsProps {
  // null while the item is loading or failed to load
  item: ItemDetailData | null;
  onEdit: () => void;
  onDeleted: () => void;
}

// Labels collapse to icons on narrow screens so the bar fits on one line
function ActionLabel({ children }: { children: string }) {
  return <span className="max-sm:sr-only">{children}</span>;
}

// Favorite and Pin show state only; their behavior comes in later specs
export function ItemDrawerActions({ item, onEdit, onDeleted }: ItemDrawerActionsProps) {
  const copyText = item ? getItemCopyText(item) : null;

  async function handleCopy() {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  }

  return (
    <div className="flex items-center gap-1 border-b px-4 pb-4">
      <Button
        variant="ghost"
        disabled={!item}
        aria-pressed={item?.isFavorite ?? false}
        className={item?.isFavorite ? "text-yellow-400 hover:text-yellow-400" : undefined}
      >
        <Star className={item?.isFavorite ? "fill-yellow-400" : undefined} />
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
