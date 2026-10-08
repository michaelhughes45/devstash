import { cache } from "react";

import { CREATABLE_ITEM_TYPES } from "@/lib/item-content";
import { DEFAULT_TYPE_COLOR, DEFAULT_TYPE_ICON } from "@/lib/item-type-icons";
import {
  capitalize,
  compareItemTypes,
  getTypeDisplayName,
  getTypeSlug,
  isProSystemType,
} from "@/lib/item-type-names";
import { prisma } from "@/lib/prisma";
import type { CreatableItemTypeOption } from "@/types/items";

export interface ItemTypeWithCount {
  id: string;
  // Display name, e.g. "Snippets"
  name: string;
  // URL segment for /items/[slug], e.g. "snippets"
  slug: string;
  icon: string;
  color: string;
  count: number;
  isPro: boolean;
}

// Cached per request: the sidebar and /items/[type] both need it
export const getItemTypesWithCounts = cache(
  async (userId: string): Promise<ItemTypeWithCount[]> => {
    const [types, counts] = await Promise.all([
      prisma.itemType.findMany({
        where: { OR: [{ isSystem: true }, { userId }] },
        select: { id: true, name: true, icon: true, color: true, isSystem: true },
      }),
      prisma.item.groupBy({ by: ["typeId"], where: { userId }, _count: true }),
    ]);

    const countByTypeId = new Map(counts.map((row) => [row.typeId, row._count]));

    return types.sort(compareItemTypes).map((type) => ({
      id: type.id,
      name: getTypeDisplayName(type.name),
      slug: getTypeSlug(type.name),
      icon: type.icon ?? DEFAULT_TYPE_ICON,
      color: type.color ?? DEFAULT_TYPE_COLOR,
      count: countByTypeId.get(type.id) ?? 0,
      isPro: isProSystemType(type.name, type.isSystem),
    }));
  },
);

// System types the New Item dialog offers, in CREATABLE_ITEM_TYPES order.
// Cached per request, since every signed-in page renders the top bar.
export const getCreatableItemTypes = cache(
  async (): Promise<CreatableItemTypeOption[]> => {
    const types = await prisma.itemType.findMany({
      where: { isSystem: true, userId: null, name: { in: [...CREATABLE_ITEM_TYPES] } },
      select: { name: true, icon: true, color: true },
    });

    return CREATABLE_ITEM_TYPES.flatMap((name) => {
      const type = types.find((row) => row.name === name);
      if (!type) return [];
      return {
        name,
        label: capitalize(name),
        icon: type.icon ?? DEFAULT_TYPE_ICON,
        color: type.color ?? DEFAULT_TYPE_COLOR,
      };
    });
  },
);

// Resolves an /items/[type] segment; Next.js may pass it decoded or encoded
export async function getItemTypeBySlug(
  userId: string,
  slug: string,
): Promise<ItemTypeWithCount | null> {
  const types = await getItemTypesWithCounts(userId);
  return (
    types.find(
      (type) => type.slug === slug || decodeURIComponent(type.slug) === slug,
    ) ?? null
  );
}
