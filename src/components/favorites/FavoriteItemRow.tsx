import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { FavoriteRow } from "@/components/favorites/FavoriteRow";
import { ItemCardTrigger } from "@/components/items/ItemCardTrigger";
import type { FavoriteItem } from "@/lib/db/items";

interface FavoriteItemRowProps {
  item: FavoriteItem;
}

// Opens the item drawer
export function FavoriteItemRow({ item }: FavoriteItemRowProps) {
  const { type } = item;

  return (
    <li className="transition-colors hover:bg-muted/40">
      <ItemCardTrigger
        preview={{ id: item.id, title: item.title, type }}
        className="rounded-none focus-visible:ring-inset"
      >
        <FavoriteRow
          icon={
            <ItemTypeIcon
              icon={type.icon}
              className="size-4"
              style={{ color: type.color }}
              aria-hidden
            />
          }
          title={item.title}
          badge={type.name}
          date={item.updatedAt}
        />
      </ItemCardTrigger>
    </li>
  );
}
