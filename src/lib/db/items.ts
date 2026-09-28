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

export interface ItemTypeWithCount {
  id: string;
  // Display name, e.g. "Snippets"
  name: string;
  // URL segment for /items/[slug], e.g. "snippets"
  slug: string;
  icon: string;
  color: string;
  count: number;
}

// Sidebar order for system types; custom types follow alphabetically
const SYSTEM_TYPE_ORDER = ["snippet", "prompt", "command", "note", "file", "image", "link"];

function getTypeRank(name: string, isSystem: boolean): number {
  const index = SYSTEM_TYPE_ORDER.indexOf(name);
  return isSystem && index !== -1 ? index : SYSTEM_TYPE_ORDER.length;
}

function toPlural(name: string): string {
  return name.endsWith("s") ? name : `${name}s`;
}

export async function getItemTypesWithCounts(
  userId: string,
): Promise<ItemTypeWithCount[]> {
  const [types, counts] = await Promise.all([
    prisma.itemType.findMany({
      where: { OR: [{ isSystem: true }, { userId }] },
      select: { id: true, name: true, icon: true, color: true, isSystem: true },
    }),
    prisma.item.groupBy({ by: ["typeId"], where: { userId }, _count: true }),
  ]);

  const countByTypeId = new Map(counts.map((row) => [row.typeId, row._count]));

  return types
    .sort(
      (a, b) =>
        getTypeRank(a.name, a.isSystem) - getTypeRank(b.name, b.isSystem) ||
        a.name.localeCompare(b.name),
    )
    .map((type) => {
      const plural = toPlural(type.name);
      return {
        id: type.id,
        name: plural.charAt(0).toUpperCase() + plural.slice(1),
        slug: encodeURIComponent(plural.toLowerCase()),
        icon: type.icon ?? DEFAULT_TYPE_ICON,
        color: type.color ?? DEFAULT_TYPE_COLOR,
        count: countByTypeId.get(type.id) ?? 0,
      };
    });
}

export async function getItemStats(userId: string): Promise<ItemStats> {
  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);
  return { total, favorites };
}
