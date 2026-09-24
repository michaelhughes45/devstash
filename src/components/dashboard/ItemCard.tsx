import { Pin, Star } from "lucide-react";

import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getItemTypeById, type MockItem } from "@/lib/mock-data";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

interface ItemCardProps {
  item: MockItem;
}

export function ItemCard({ item }: ItemCardProps) {
  const type = getItemTypeById(item.typeId);

  return (
    <Card
      className="border-l-4 border-l-border"
      style={{ borderLeftColor: type?.color }}
    >
      <CardContent className="flex items-start gap-4">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted"
          style={{ color: type?.color }}
        >
          <ItemTypeIcon
            icon={type?.icon ?? ""}
            className="size-5"
            aria-label={type?.name}
          />
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
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {item.description}
          </p>
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
          dateTime={item.createdAt}
          className="shrink-0 text-xs text-muted-foreground"
        >
          {DATE_FORMAT.format(new Date(item.createdAt))}
        </time>
      </CardContent>
    </Card>
  );
}
