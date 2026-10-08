import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { ItemsList } from "@/components/items/ItemsList";
import { getItemsByType, getItemTypeBySlug } from "@/lib/db/items";
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
}: PageProps<"/items/[type]">) {
  const { type: slug } = await params;

  // The proxy only checks the JWT signature; a revoked session gets here without a user
  const userId = await getCurrentUserId();
  if (!userId) redirect(`/sign-in?callbackUrl=/items/${encodeURIComponent(slug)}`);

  const itemType = await getItemTypeBySlug(userId, slug);
  if (!itemType) notFound();

  const items = await getItemsByType(userId, itemType.id);

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
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      <ItemsList typeName={itemType.name} items={items} />
    </div>
  );
}
