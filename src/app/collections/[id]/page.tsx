import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FolderOpen, Star } from "lucide-react";

import { CollectionItems } from "@/components/collections/CollectionItems";
import { getCollection } from "@/lib/db/collections";
import { getItemsByCollection } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/collections/[id]">): Promise<Metadata> {
  const [{ id }, userId] = await Promise.all([params, getCurrentUserId()]);
  const collection = userId ? await getCollection(userId, id) : null;
  return { title: `${collection?.name ?? "Collection"} · DevStash` };
}

export default async function CollectionPage({ params }: PageProps<"/collections/[id]">) {
  const { id } = await params;

  // The proxy only checks the JWT signature; a revoked session gets here without a user
  const userId = await getCurrentUserId();
  if (!userId) redirect(`/sign-in?callbackUrl=/collections/${encodeURIComponent(id)}`);

  const [collection, items] = await Promise.all([
    getCollection(userId, id),
    getItemsByCollection(userId, id),
  ]);
  if (!collection) notFound();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <FolderOpen className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <span className="truncate">{collection.name}</span>
            {collection.isFavorite && (
              <Star
                className="size-5 shrink-0 fill-yellow-400 text-yellow-400"
                aria-label="Favorite"
              />
            )}
          </h1>
          <p className="text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
          {collection.description && (
            <p className="mt-2 text-sm text-muted-foreground">{collection.description}</p>
          )}
        </div>
      </div>

      <CollectionItems items={items} />
    </div>
  );
}
