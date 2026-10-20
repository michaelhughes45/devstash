import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { Pagination } from "@/components/dashboard/Pagination";
import { ItemsList } from "@/components/items/ItemsList";
import { ProTypeUpgrade } from "@/components/items/ProTypeUpgrade";
import { getItemTypeBySlug } from "@/lib/db/item-types";
import { getItemsByType } from "@/lib/db/items";
import { getPageCount, ITEMS_PER_PAGE, pageHref, pageRange, parsePage } from "@/lib/pagination";
import { getCurrentUser, getCurrentUserId } from "@/lib/session";

// Upgrade screen copy for the Pro-only types, by slug
const PRO_TYPE_DESCRIPTIONS: Record<string, string> = {
  files: "Upload and manage files like PDFs, documents, config files and more.",
  images: "Upload and organize screenshots, diagrams, mockups and other images.",
};

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
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?callbackUrl=/items/${encodeURIComponent(slug)}`);
  const userId = user.id;

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

  // Downgraded users keep their existing files and images, so only an empty list is replaced
  if (itemType.isPro && !user.isPro && total === 0) {
    return (
      <ProTypeUpgrade
        name={itemType.name}
        icon={itemType.icon}
        color={itemType.color}
        description={PRO_TYPE_DESCRIPTIONS[itemType.slug] ?? ""}
      />
    );
  }

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
