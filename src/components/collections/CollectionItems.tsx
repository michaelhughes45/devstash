import { FileList, ItemGrid } from "@/components/items/ItemsList";
import type { ItemWithType } from "@/lib/db/items";
import { isFileType } from "@/lib/item-content";

interface CollectionItemsProps {
  items: ItemWithType[];
}

// A collection mixes types: cards and images share a grid, and files keep their
// list below it
export function CollectionItems({ items }: CollectionItemsProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No items in this collection yet.</p>;
  }

  const files = items.filter((item) => isFileType(item.type.name));
  const others = items.filter((item) => !isFileType(item.type.name));

  return (
    <div className="flex flex-col gap-6">
      {others.length > 0 && <ItemGrid items={others} />}
      {files.length > 0 && <FileList items={files} />}
    </div>
  );
}
