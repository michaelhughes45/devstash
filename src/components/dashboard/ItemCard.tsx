import { Pin, Star } from "lucide-react";

import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { CopyItemButton } from "@/components/items/CopyItemButton";
import { ItemCardTrigger } from "@/components/items/ItemCardTrigger";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ItemWithType } from "@/lib/db/items";
import { getItemCopyText } from "@/lib/item-content";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

interface ItemCardProps {
  item: ItemWithType;
}

// The copy button sits beside the drawer trigger, not inside it, since a button can't be
// nested in a button; it overlays the card's bottom-right corner, below the date
export function ItemCard({ item }: ItemCardProps) {
  const { type } = item;
  const copyText = getItemCopyText(item);

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
                {item.isFavorite && (
                  <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
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
              {DATE_FORMAT.format(item.createdAt)}
            </time>
          </CardContent>
        </Card>
      </ItemCardTrigger>
      {copyText && (
        <CopyItemButton
          text={copyText}
          title={item.title}
          className="absolute right-2.5 bottom-2.5"
        />
      )}
    </div>
  );
}
