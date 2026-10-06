import { ImageIcon, Pin, Star } from "lucide-react";

import { ItemCardTrigger } from "@/components/items/ItemCardTrigger";
import { Card, CardContent } from "@/components/ui/card";
import type { ItemWithType } from "@/lib/db/items";
import { safeExternalUrl } from "@/lib/item-content";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

interface ImageCardProps {
  item: ItemWithType;
}

// Gallery card for image items: a 16:9 thumbnail above the title
export function ImageCard({ item }: ImageCardProps) {
  const { type } = item;
  const imageUrl = safeExternalUrl(item.fileUrl);

  return (
    <ItemCardTrigger preview={{ id: item.id, title: item.title, type }}>
      <Card className="h-full pt-0 transition-colors hover:bg-muted/40">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {imageUrl ? (
            // Served from R2's public URL; next/image would need it as a remote pattern
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={item.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover/card:scale-105 motion-reduce:transition-none motion-reduce:group-hover/card:scale-100"
            />
          ) : (
            <div
              className="flex size-full items-center justify-center"
              style={{ color: type.color }}
            >
              <ImageIcon className="size-8" aria-label="No image" />
            </div>
          )}
        </div>
        <CardContent className="flex items-center gap-2">
          <h3 className="min-w-0 flex-1 truncate font-medium">{item.title}</h3>
          {item.isPinned && <Pin className="size-3.5 shrink-0 text-muted-foreground" />}
          {item.isFavorite && (
            <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
          <time
            dateTime={item.createdAt.toISOString()}
            className="shrink-0 text-xs text-muted-foreground"
          >
            {DATE_FORMAT.format(item.createdAt)}
          </time>
        </CardContent>
      </Card>
    </ItemCardTrigger>
  );
}
