import Link from "next/link";
import { MoreHorizontal, Star } from "lucide-react";

import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getItemTypeById, type MockCollection } from "@/lib/mock-data";

interface CollectionCardProps {
  collection: MockCollection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const types = collection.typeIds
    .map(getItemTypeById)
    .filter((type) => type !== undefined);
  const accent = types[0]?.color;

  return (
    <Card
      className="relative border-l-4 border-l-border transition-colors hover:bg-accent/40"
      style={{ borderLeftColor: accent }}
    >
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 font-medium">
              <Link
                href={`/collections/${collection.id}`}
                className="truncate after:absolute after:inset-0"
              >
                {collection.name}
              </Link>
              {collection.isFavorite && (
                <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {collection.itemCount} items
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            aria-label={`${collection.name} options`}
          >
            <MoreHorizontal />
          </Button>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {collection.description}
        </p>
        <div className="flex items-center gap-2">
          {types.map((type) => (
            <ItemTypeIcon
              key={type.id}
              icon={type.icon}
              className="size-4"
              style={{ color: type.color }}
              aria-label={type.name}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
