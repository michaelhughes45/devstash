import { FREE_COLLECTION_LIMIT, FREE_ITEM_LIMIT } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";

export { isProOnlyItemType, PRO_ONLY_ITEM_TYPES } from "@/lib/item-type-names";
export { FREE_COLLECTION_LIMIT, FREE_ITEM_LIMIT } from "@/lib/plan-limits";

export const ITEM_LIMIT_ERROR = `You've reached the free plan limit of ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited items.`;
export const COLLECTION_LIMIT_ERROR = `You've reached the free plan limit of ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro for unlimited collections.`;
export const PRO_TYPE_ERROR = "File and image uploads require a Pro subscription.";

export interface UserUsage {
  itemCount: number;
  collectionCount: number;
  canCreateItem: boolean;
  canCreateCollection: boolean;
}

export async function getUserUsage(userId: string, isPro: boolean): Promise<UserUsage> {
  const [itemCount, collectionCount] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
  ]);
  return {
    itemCount,
    collectionCount,
    canCreateItem: isPro || itemCount < FREE_ITEM_LIMIT,
    canCreateCollection: isPro || collectionCount < FREE_COLLECTION_LIMIT,
  };
}

// Pro users skip the query entirely
export async function canCreateItem(userId: string, isPro: boolean): Promise<boolean> {
  if (isPro) return true;
  return (await prisma.item.count({ where: { userId } })) < FREE_ITEM_LIMIT;
}

export async function canCreateCollection(userId: string, isPro: boolean): Promise<boolean> {
  if (isPro) return true;
  return (await prisma.collection.count({ where: { userId } })) < FREE_COLLECTION_LIMIT;
}
