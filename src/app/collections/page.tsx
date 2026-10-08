import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { getAllCollections } from "@/lib/db/collections";
import { getCurrentUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Collections · DevStash" };

export default async function CollectionsPage() {
  // The proxy only checks the JWT signature; a revoked session gets here without a user
  const userId = await getCurrentUserId();
  if (!userId) redirect("/sign-in?callbackUrl=/collections");

  const collections = await getAllCollections(userId);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Collections</h1>
        <p className="text-muted-foreground">
          {collections.length} {collections.length === 1 ? "collection" : "collections"}
        </p>
      </div>

      {collections.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No collections yet. Create one with New Collection.
        </p>
      )}
    </div>
  );
}
