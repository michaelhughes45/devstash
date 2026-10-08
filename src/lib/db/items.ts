import { Prisma, type ContentType } from "@/generated/prisma/client";
import { getContentTypeForType } from "@/lib/item-content";
import { DEFAULT_TYPE_COLOR, DEFAULT_TYPE_ICON } from "@/lib/item-type-icons";
import { prisma } from "@/lib/prisma";
import { isRecordNotFound } from "@/lib/prisma-errors";
import type { CreateItemData, UpdateItemData } from "@/lib/validations/items";

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
  // Original name and size in bytes of an uploaded file, shown in the file list
  fileName: string | null;
  fileSize: number | null;
  // Decide what the card's quick copy button copies (see getCardCopySource); text
  // content is left out so long items aren't sent with every card
  contentType: ContentType;
  url: string | null;
  type: ItemCardType;
  tags: string[];
}

export interface ItemStats {
  total: number;
  favorites: number;
}

const ITEM_CARD_SELECT = {
  id: true,
  title: true,
  description: true,
  isFavorite: true,
  isPinned: true,
  createdAt: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
  contentType: true,
  url: true,
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

// The items in one of the user's collections, most recently added first
export async function getItemsByCollection(
  userId: string,
  collectionId: string,
): Promise<ItemWithType[]> {
  const links = await prisma.itemCollection.findMany({
    where: { collectionId, item: { userId } },
    select: { item: { select: ITEM_CARD_SELECT } },
    orderBy: { addedAt: "desc" },
  });
  return links.map(({ item }) => toItemWithType(item));
}

export interface ItemDetail extends ItemWithType {
  content: string | null;
  language: string | null;
  updatedAt: Date;
  collections: { id: string; name: string }[];
}

const ITEM_DETAIL_SELECT = {
  ...ITEM_CARD_SELECT,
  content: true,
  language: true,
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

export interface ItemKind {
  contentType: ContentType;
  type: { name: string };
}

// The content type and type name that decide which fields an update may change.
// Scoped to the owner like getItemDetail: returns null for a missing or someone
// else's item.
export async function getItemKind(userId: string, itemId: string): Promise<ItemKind | null> {
  return prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { contentType: true, type: { select: { name: true } } },
  });
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

// Links an item to each collection; the caller checks the user owns them
function collectionLinks(collectionIds: string[]) {
  return collectionIds.map((collectionId) => ({ collectionId }));
}

// Replaces an item's collection links with `collectionIds`, keeping links that
// stay (and when they were added) and removing the rest
function replaceCollectionLinks(itemId: string, collectionIds: string[]) {
  return {
    deleteMany: { collectionId: { notIn: collectionIds } },
    connectOrCreate: collectionIds.map((collectionId) => ({
      where: { itemId_collectionId: { itemId, collectionId } },
      create: { collectionId },
    })),
  };
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
  { type, tags, collectionIds, ...fields }: Omit<CreateItemData, "fileKey">,
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
      collections: { create: collectionLinks(collectionIds) },
    },
    select: ITEM_DETAIL_SELECT,
  });
  return toItemDetail(item);
}

// Replaces the item's tags with `tags`, creating any the user doesn't have yet,
// and its collections with `collectionIds` when given (the caller checks the
// user owns them). Scoped to the owner like getItemDetail: returns null for a missing or
// someone else's item.
export async function updateItem(
  userId: string,
  itemId: string,
  { tags, collectionIds, ...fields }: UpdateItemData,
): Promise<ItemDetail | null> {
  try {
    const item = await prisma.item.update({
      where: { id: itemId, userId },
      data: {
        ...fields,
        tags: { deleteMany: {}, create: tagLinks(userId, tags) },
        ...(collectionIds && { collections: replaceCollectionLinks(itemId, collectionIds) }),
      },
      select: ITEM_DETAIL_SELECT,
    });
    return toItemDetail(item);
  } catch (error) {
    if (isRecordNotFound(error)) return null;
    throw error;
  }
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
    if (isRecordNotFound(error)) return null;
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
