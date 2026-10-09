import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FolderOpen, Star } from "lucide-react";

import { CollectionActions } from "@/components/collections/CollectionActions";
import { CollectionItems } from "@/components/collections/CollectionItems";
import { Pagination } from "@/components/dashboard/Pagination";
import { getCollection } from "@/lib/db/collections";
import { getItemsByCollection } from "@/lib/db/items";
import { getPageCount, ITEMS_PER_PAGE, pageHref, pageRange, parsePage } from "@/lib/pagination";
import { getCurrentUserId } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/collections/[id]">): Promise<Metadata> {
  const [{ id }, userId] = await Promise.all([params, getCurrentUserId()]);
  const collection = userId ? await getCollection(userId, id) : null;
  return { title: `${collection?.name ?? "Collection"} · DevStash` };
}

export default async function CollectionPage({
  params,
  searchParams,
}: PageProps<"/collections/[id]">) {
  const [{ id }, { page: pageParam }] = await Promise.all([params, searchParams]);
  const page = parsePage(pageParam);

  // The proxy only checks the JWT signature; a revoked session gets here without a user
  const userId = await getCurrentUserId();
  if (!userId) redirect(`/sign-in?callbackUrl=/collections/${encodeURIComponent(id)}`);

  const [collection, { rows: items, total }] = await Promise.all([
    getCollection(userId, id),
    getItemsByCollection(userId, id, pageRange(page, ITEMS_PER_PAGE)),
  ]);
  if (!collection) notFound();

  const basePath = `/collections/${encodeURIComponent(id)}`;
  const pageCount = getPageCount(total, ITEMS_PER_PAGE);
  // e.g. the last item on the last page was deleted or removed from the collection
  if (page > pageCount) redirect(pageHref(basePath, pageCount));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <FolderOpen className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
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
            {total} {total === 1 ? "item" : "items"}
          </p>
          {collection.description && (
            <p className="mt-2 text-sm text-muted-foreground">{collection.description}</p>
          )}
        </div>
        <CollectionActions collection={collection} />
      </div>

      <CollectionItems items={items} />
      <Pagination basePath={basePath} page={page} pageCount={pageCount} />
    </div>
  );
}
