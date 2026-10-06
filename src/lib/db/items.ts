import { cache } from "react";

import { Prisma, type ContentType } from "@/generated/prisma/client";
import { CREATABLE_ITEM_TYPES, getContentTypeForType } from "@/lib/item-content";
import { prisma } from "@/lib/prisma";
import type { CreateItemData, UpdateItemData } from "@/lib/validations/items";
import type { CreatableItemTypeOption } from "@/types/items";

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
  // Public R2 URL for file and image items; image cards use it as the thumbnail
  fileUrl: string | null;
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
  fileUrl: true,
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

export async function getPinnedItems(
  userId: string,
  limit: number,
): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    select: ITEM_CARD_SELECT,
    orderBy: { updatedAt: "desc" },
    take: limit,
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
  isPro: boolean;
}

// Sidebar order for system types; custom types follow alphabetically
const SYSTEM_TYPE_ORDER = ["snippet", "prompt", "command", "note", "file", "image", "link"];

// System types shown with a PRO badge in the sidebar
const PRO_SYSTEM_TYPES = ["file", "image"];

function getTypeRank(name: string, isSystem: boolean): number {
  const index = SYSTEM_TYPE_ORDER.indexOf(name);
  return isSystem && index !== -1 ? index : SYSTEM_TYPE_ORDER.length;
}

function toPlural(name: string): string {
  return name.endsWith("s") ? name : `${name}s`;
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
          isPro: type.isSystem && PRO_SYSTEM_TYPES.includes(type.name),
        };
      });
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
        label: name.charAt(0).toUpperCase() + name.slice(1),
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

export async function getItemsByType(
  userId: string,
  typeId: string,
): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId, typeId },
    select: ITEM_CARD_SELECT,
    orderBy: { createdAt: "desc" },
  });
  return items.map(toItemWithType);
}

export interface ItemDetail extends ItemWithType {
  contentType: ContentType;
  content: string | null;
  language: string | null;
  url: string | null;
  fileName: string | null;
  fileSize: number | null;
  updatedAt: Date;
  collections: { id: string; name: string }[];
}

const ITEM_DETAIL_SELECT = {
  ...ITEM_CARD_SELECT,
  contentType: true,
  content: true,
  language: true,
  url: true,
  fileName: true,
  fileSize: true,
  updatedAt: true,
  collections: {
    select: { collection: { select: { id: true, name: true } } },
    orderBy: { collection: { name: "asc" } },
  },
} satisfies Prisma.ItemSelect;

type ItemDetailRow = Prisma.ItemGetPayload<{ select: typeof ITEM_DETAIL_SELECT }>;

function toItemDetail({ collections, ...rest }: ItemDetailRow): ItemDetail {
  return {
    ...rest,
    ...toItemWithType(rest),
    collections: collections.map(({ collection }) => collection),
  };
}

// Scoped to the owner, so another user's item id returns null
export async function getItemDetail(
  userId: string,
  itemId: string,
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: ITEM_DETAIL_SELECT,
  });
  return item ? toItemDetail(item) : null;
}

// Links each tag by name, creating any the user doesn't have yet
function tagLinks(userId: string, tags: string[]) {
  return tags.map((name) => ({
    tag: {
      connectOrCreate: {
        where: { userId_name: { userId, name } },
        create: { userId, name },
      },
    },
  }));
}

// The uploaded file behind a file or image item, as stored on the item
export interface ItemFileData {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

// Creates an item of a system type, looked up by name. Returns null if that
// system type doesn't exist (e.g. an unseeded database). `file` is the
// verified upload for file and image items.
export async function createItem(
  userId: string,
  // The caller resolves fileKey into `file`
  { type, tags, ...fields }: Omit<CreateItemData, "fileKey">,
  file: ItemFileData | null = null,
): Promise<ItemDetail | null> {
  const itemType = await prisma.itemType.findFirst({
    where: { name: type, isSystem: true, userId: null },
    select: { id: true },
  });
  if (!itemType) return null;

  const item = await prisma.item.create({
    data: {
      ...fields,
      ...file,
      contentType: getContentTypeForType(type),
      userId,
      typeId: itemType.id,
      tags: { create: tagLinks(userId, tags) },
    },
    select: ITEM_DETAIL_SELECT,
  });
  return toItemDetail(item);
}

// Replaces the item's tags with `tags`, creating any the user doesn't have yet.
// Scoped to the owner like getItemDetail: returns null for a missing or
// someone else's item.
export async function updateItem(
  userId: string,
  itemId: string,
  { tags, ...fields }: UpdateItemData,
): Promise<ItemDetail | null> {
  try {
    const item = await prisma.item.update({
      where: { id: itemId, userId },
      data: {
        ...fields,
        tags: { deleteMany: {}, create: tagLinks(userId, tags) },
      },
      select: ITEM_DETAIL_SELECT,
    });
    return toItemDetail(item);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return null;
    }
    throw error;
  }
}

// True for a unique constraint failure, e.g. createItem with a fileUrl another
// item already has
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

// The owner's file or image item's stored file, for the download route
export async function getItemFile(
  userId: string,
  itemId: string,
): Promise<{ fileUrl: string; fileName: string | null } | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId, contentType: "FILE", fileUrl: { not: null } },
    select: { fileUrl: true, fileName: true },
  });
  return item?.fileUrl ? { fileUrl: item.fileUrl, fileName: item.fileName } : null;
}

export interface DeletedItem {
  // Set for file and image items, so the caller can delete the stored file
  fileUrl: string | null;
}

// Its tag and collection links go with it (cascade); the tags and collections
// stay. Returns null for a missing or someone else's item.
export async function deleteItem(userId: string, itemId: string): Promise<DeletedItem | null> {
  try {
    return await prisma.item.delete({
      where: { id: itemId, userId },
      select: { fileUrl: true },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return null;
    }
    throw error;
  }
}

export async function getItemStats(userId: string): Promise<ItemStats> {
  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);
  return { total, favorites };
}
