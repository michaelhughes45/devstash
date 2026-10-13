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
import { cn } from "@/lib/utils";

interface ItemCardProps {
  item: ItemWithType;
}

function CardDate({ date, className }: { date: Date; className: string }) {
  return (
    <time
      dateTime={date.toISOString()}
      className={cn("shrink-0 text-xs text-muted-foreground", className)}
    >
      {formatShortDate(date)}
    </time>
  );
}

// The favorite and copy buttons sit beside the drawer trigger, not inside it, since a
// button can't be nested in a button; they overlay the card's bottom-right corner,
// below the date. On phones the icon tile is dropped and the date moves into that
// bottom row, so the title gets the card's full width
export function ItemCard({ item }: ItemCardProps) {
  const { type } = item;
  const copySource = getCardCopySource(item);

  return (
    <div className="relative h-full">
      <ItemCardTrigger preview={{ id: item.id, title: item.title, type }} className="h-full">
        <Card
          className="h-full border-l-4 border-l-border transition-colors hover:bg-muted/40 max-sm:pb-14"
          style={{ borderLeftColor: type.color }}
        >
          <CardContent className="flex items-start gap-4">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted max-sm:hidden"
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
            <CardDate date={item.createdAt} className="max-sm:hidden" />
          </CardContent>
        </Card>
      </ItemCardTrigger>
      {/* Clicks between the buttons fall through to the drawer trigger underneath */}
      <div className="pointer-events-none absolute right-2.5 bottom-2.5 flex items-center gap-0.5 max-sm:left-5 max-sm:gap-2">
        <CardDate date={item.createdAt} className="mr-auto sm:hidden" />
        <FavoriteItemButton
          itemId={item.id}
          isFavorite={item.isFavorite}
          title={item.title}
          className="pointer-events-auto max-sm:size-9"
        />
        {copySource && (
          <CopyItemButton
            itemId={item.id}
            source={copySource}
            title={item.title}
            className="pointer-events-auto max-sm:size-9"
          />
        )}
      </div>
    </div>
  );
}
