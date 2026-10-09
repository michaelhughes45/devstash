import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { Pagination } from "@/components/dashboard/Pagination";
import { ItemsList } from "@/components/items/ItemsList";
import { getItemTypeBySlug } from "@/lib/db/item-types";
import { getItemsByType } from "@/lib/db/items";
import { getPageCount, ITEMS_PER_PAGE, pageHref, pageRange, parsePage } from "@/lib/pagination";
import { getCurrentUserId } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/items/[type]">): Promise<Metadata> {
  const [{ type: slug }, userId] = await Promise.all([params, getCurrentUserId()]);
  const itemType = userId ? await getItemTypeBySlug(userId, slug) : null;
  return { title: `${itemType?.name ?? "Items"} · DevStash` };
}

export default async function ItemsByTypePage({
  params,
  searchParams,
}: PageProps<"/items/[type]">) {
  const [{ type: slug }, { page: pageParam }] = await Promise.all([params, searchParams]);
  const page = parsePage(pageParam);

  // The proxy only checks the JWT signature; a revoked session gets here without a user
  const userId = await getCurrentUserId();
  if (!userId) redirect(`/sign-in?callbackUrl=/items/${encodeURIComponent(slug)}`);

  const itemType = await getItemTypeBySlug(userId, slug);
  if (!itemType) notFound();

  const basePath = `/items/${encodeURIComponent(slug)}`;
  const { rows: items, total } = await getItemsByType(
    userId,
    itemType.id,
    pageRange(page, ITEMS_PER_PAGE),
  );
  const pageCount = getPageCount(total, ITEMS_PER_PAGE);
  // e.g. the last item on the last page was deleted
  if (page > pageCount) redirect(pageHref(basePath, pageCount));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <div className="flex items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted"
          style={{ color: itemType.color }}
        >
          <ItemTypeIcon icon={itemType.icon} className="size-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{itemType.name}</h1>
          <p className="text-muted-foreground">
            {total} {total === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      <ItemsList typeName={itemType.name} items={items} />
      <Pagination basePath={basePath} page={page} pageCount={pageCount} />
    </div>
  );
}
