import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { Pagination } from "@/components/dashboard/Pagination";
import { getCollectionsPage } from "@/lib/db/collections";
import {
  COLLECTIONS_PER_PAGE,
  getPageCount,
  pageHref,
  pageRange,
  parsePage,
} from "@/lib/pagination";
import { getCurrentUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Collections · DevStash" };

export default async function CollectionsPage({ searchParams }: PageProps<"/collections">) {
  const page = parsePage((await searchParams).page);

  // The proxy only checks the JWT signature; a revoked session gets here without a user
  const userId = await getCurrentUserId();
  if (!userId) redirect("/sign-in?callbackUrl=/collections");

  const { rows: collections, total } = await getCollectionsPage(
    userId,
    pageRange(page, COLLECTIONS_PER_PAGE),
  );
  const pageCount = getPageCount(total, COLLECTIONS_PER_PAGE);
  // e.g. the last collection on the last page was deleted
  if (page > pageCount) redirect(pageHref("/collections", pageCount));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Collections</h1>
        <p className="text-muted-foreground">
          {total} {total === 1 ? "collection" : "collections"}
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
      <Pagination basePath="/collections" page={page} pageCount={pageCount} />
    </div>
  );
}
