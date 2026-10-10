"use client";

import { useMemo, useState } from "react";

import { FavoriteCollectionRow } from "@/components/favorites/FavoriteCollectionRow";
import { FavoriteItemRow } from "@/components/favorites/FavoriteItemRow";
import { FavoritesSection } from "@/components/favorites/FavoritesSection";
import { FavoritesSortControl } from "@/components/favorites/FavoritesSortControl";
import type { CollectionWithTypes } from "@/lib/db/collections";
import type { FavoriteItem } from "@/lib/db/items";
import {
  sortFavoriteCollections,
  sortFavoriteItems,
  type FavoriteSort,
} from "@/lib/favorites-sort";

interface FavoritesListsProps {
  items: FavoriteItem[];
  collections: CollectionWithTypes[];
}

// Sorts in the browser; the server sends the favorites once, newest first
export function FavoritesLists({ items, collections }: FavoritesListsProps) {
  const [sort, setSort] = useState<FavoriteSort>("date");
  const sortedItems = useMemo(() => sortFavoriteItems(items, sort), [items, sort]);
  const sortedCollections = useMemo(
    () => sortFavoriteCollections(collections, sort),
    [collections, sort],
  );

  return (
    <div className="flex flex-col gap-6 font-mono text-sm">
      <FavoritesSortControl value={sort} onChange={setSort} />
      <FavoritesSection title="Items" count={items.length} emptyText="No favorite items.">
        {sortedItems.map((item) => (
          <FavoriteItemRow key={item.id} item={item} />
        ))}
      </FavoritesSection>
      <FavoritesSection
        title="Collections"
        count={collections.length}
        emptyText="No favorite collections."
      >
        {sortedCollections.map((collection) => (
          <FavoriteCollectionRow key={collection.id} collection={collection} />
        ))}
      </FavoritesSection>
    </div>
  );
}
