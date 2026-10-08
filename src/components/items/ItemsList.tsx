import { ItemCard } from "@/components/dashboard/ItemCard";
import { FileRow } from "@/components/items/FileRow";
import { ImageCard } from "@/components/items/ImageCard";
import type { ItemWithType } from "@/lib/db/items";
import { isFileType, isImageType } from "@/lib/item-content";

interface ItemsListProps {
  // Display name, e.g. "Snippets", for the empty state
  typeName: string;
  items: ItemWithType[];
}

// Files show as a list, images as a gallery and everything else as cards. Every
// item on the page shares one type; the page's type only has the display name,
// so the stored name comes from the first item.
export function ItemsList({ typeName, items }: ItemsListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No {typeName.toLowerCase()} yet.</p>;
  }

  if (isFileType(items[0].type.name)) {
    return (
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {items.map((item) => (
          <FileRow key={item.id} item={item} />
        ))}
      </ul>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) =>
        isImageType(item.type.name) ? (
          <ImageCard key={item.id} item={item} />
        ) : (
          <ItemCard key={item.id} item={item} />
        ),
      )}
    </div>
  );
}
