import Link from "next/link";
import { Folder } from "lucide-react";

import { FavoriteRow } from "@/components/favorites/FavoriteRow";
import type { CollectionWithTypes } from "@/lib/db/collections";

interface FavoriteCollectionRowProps {
  collection: CollectionWithTypes;
}

// Goes to the collection's page
export function FavoriteCollectionRow({ collection }: FavoriteCollectionRowProps) {
  // Types are sorted most-used first, so the first one colors the icon
  const accent = collection.types[0]?.color;

  return (
    <li className="transition-colors hover:bg-muted/40">
      <Link
        href={`/collections/${collection.id}`}
        className="block outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        <FavoriteRow
          icon={
            <Folder
              className="size-4 text-muted-foreground"
              style={{ color: accent }}
              aria-hidden
            />
          }
          title={collection.name}
          badge="collection"
          date={collection.updatedAt}
        />
      </Link>
    </li>
  );
}
