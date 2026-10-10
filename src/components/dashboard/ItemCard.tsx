import { Pin } from "lucide-react";

import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { CopyItemButton } from "@/components/items/CopyItemButton";
import { FavoriteItemButton } from "@/components/items/FavoriteItemButton";
import { ItemCardTrigger } from "@/components/items/ItemCardTrigger";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ItemWithType } from "@/lib/db/items";
import { formatShortDate } from "@/lib/format-date";
import { getCardCopySource } from "@/lib/item-content";

interface ItemCardProps {
  item: ItemWithType;
}

// The favorite and copy buttons sit beside the drawer trigger, not inside it, since a
// button can't be nested in a button; they overlay the card's bottom-right corner,
// below the date
export function ItemCard({ item }: ItemCardProps) {
  const { type } = item;
  const copySource = getCardCopySource(item);

  return (
    <div className="relative h-full">
      <ItemCardTrigger preview={{ id: item.id, title: item.title, type }} className="h-full">
        <Card
          className="h-full border-l-4 border-l-border transition-colors hover:bg-muted/40"
          style={{ borderLeftColor: type.color }}
        >
          <CardContent className="flex items-start gap-4">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted"
              style={{ color: type.color }}
            >
              <ItemTypeIcon icon={type.icon} className="size-5" aria-label={type.name} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-medium">{item.title}</h3>
                {item.isPinned && (
                  <Pin className="size-3.5 shrink-0 text-muted-foreground" />
                )}
              </div>
              {item.description && (
                <p className="line-clamp-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <time
              dateTime={item.createdAt.toISOString()}
              className="shrink-0 text-xs text-muted-foreground"
            >
              {formatShortDate(item.createdAt)}
            </time>
          </CardContent>
        </Card>
      </ItemCardTrigger>
      <div className="absolute right-2.5 bottom-2.5 flex items-center gap-0.5">
        <FavoriteItemButton itemId={item.id} isFavorite={item.isFavorite} title={item.title} />
        {copySource && <CopyItemButton itemId={item.id} source={copySource} title={item.title} />}
      </div>
    </div>
  );
}
