import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export interface ItemCardType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface ItemWithType {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  type: ItemCardType;
  tags: string[];
}

export interface ItemStats {
  total: number;
  favorites: number;
}

const DEFAULT_TYPE_ICON = "File";
const DEFAULT_TYPE_COLOR = "#6b7280";

const ITEM_CARD_SELECT = {
  id: true,
  title: true,
  description: true,
  isFavorite: true,
  isPinned: true,
  createdAt: true,
  type: { select: { id: true, name: true, icon: true, color: true } },
  tags: { select: { tag: { select: { name: true } } } },
} satisfies Prisma.ItemSelect;

type ItemCardRow = Prisma.ItemGetPayload<{ select: typeof ITEM_CARD_SELECT }>;

function toItemWithType({ type, tags, ...item }: ItemCardRow): ItemWithType {
  return {
    ...item,
    type: {
      id: type.id,
      name: type.name,
      icon: type.icon ?? DEFAULT_TYPE_ICON,
      color: type.color ?? DEFAULT_TYPE_COLOR,
    },
    tags: tags.map(({ tag }) => tag.name),
  };
}

export async function getPinnedItems(userId: string): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    select: ITEM_CARD_SELECT,
    orderBy: { updatedAt: "desc" },
  });
  return items.map(toItemWithType);
}

export async function getRecentItems(
  userId: string,
  limit: number,
): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    select: ITEM_CARD_SELECT,
    // Never-used items fall back to their last edit
    orderBy: [{ lastUsedAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
    take: limit,
  });
  return items.map(toItemWithType);
}

export async function getItemStats(userId: string): Promise<ItemStats> {
  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);
  return { total, favorites };
}
