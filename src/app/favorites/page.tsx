import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FavoritesLists } from "@/components/favorites/FavoritesLists";
import { getFavoriteCollections } from "@/lib/db/collections";
import { getFavoriteItems } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Favorites · DevStash" };

export default async function FavoritesPage() {
  // The proxy only checks the JWT signature; a revoked session gets here without a user
  const userId = await getCurrentUserId();
  if (!userId) redirect("/sign-in?callbackUrl=/favorites");

  const [items, collections] = await Promise.all([
    getFavoriteItems(userId),
    getFavoriteCollections(userId),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Favorites</h1>
        <p className="text-muted-foreground">Your starred items and collections</p>
      </div>

      {items.length === 0 && collections.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No favorites yet. Star an item or collection to see it here.
        </p>
      ) : (
        <FavoritesLists items={items} collections={collections} />
      )}
    </div>
  );
}
