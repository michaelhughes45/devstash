import { cache } from "react";

import { Prisma } from "@/generated/prisma/client";
import { DEFAULT_TYPE_COLOR, DEFAULT_TYPE_ICON } from "@/lib/item-type-icons";
import type { Page, PageRange } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { isRecordNotFound } from "@/lib/prisma-errors";
import type {
  CreateCollectionData,
  UpdateCollectionData,
} from "@/lib/validations/collections";
import type { CollectionOption, CollectionSummary } from "@/types/collections";

export interface CollectionType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface CollectionWithTypes {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  // Distinct types in the collection, most-used first
  types: CollectionType[];
  lastUsedAt: Date;
  updatedAt: Date;
}

export interface CollectionStats {
  total: number;
  favorites: number;
}

export interface SidebarCollections {
  favorites: CollectionWithTypes[];
  recent: CollectionWithTypes[];
}

export async function getRecentCollections(
  userId: string,
  limit: number,
): Promise<CollectionWithTypes[]> {
  const collections = await getCollectionsByRecentUse(userId);
  return collections.slice(0, limit);
}

// Every collection, most recently used first, for search
export async function getAllCollections(userId: string): Promise<CollectionWithTypes[]> {
  return getCollectionsByRecentUse(userId);
}

const COLLECTION_SUMMARY_SELECT = {
  id: true,
  name: true,
  description: true,
  isFavorite: true,
} as const;

// One of the user's collections, or null when it's missing or someone else's.
// Cached per request, since the collection page and its metadata both need it.
export const getCollection = cache(
  async (userId: string, id: string): Promise<CollectionSummary | null> =>
    prisma.collection.findFirst({
      where: { id, userId },
      select: COLLECTION_SUMMARY_SELECT,
    }),
);

// Favorites plus the most recently used non-favorite collections
export async function getSidebarCollections(
  userId: string,
  recentLimit: number,
): Promise<SidebarCollections> {
  const collections = await getCollectionsByRecentUse(userId);
  return {
    favorites: collections.filter((collection) => collection.isFavorite),
    recent: collections
      .filter((collection) => !collection.isFavorite)
      .slice(0, recentLimit),
  };
}

// One row per (collection, item type) pair in the user's collections
interface CollectionTypeUsage {
  collectionId: string;
  typeId: string;
  typeName: string;
  typeIcon: string | null;
  typeColor: string | null;
  lastUsedAt: Date;
}

const COLLECTION_CARD_SELECT = {
  id: true,
  name: true,
  description: true,
  isFavorite: true,
  updatedAt: true,
  _count: { select: { items: true } },
} satisfies Prisma.CollectionSelect;

type CollectionCardRow = Prisma.CollectionGetPayload<{ select: typeof COLLECTION_CARD_SELECT }>;

// Aggregated in the database so item rows aren't loaded. Rows come most-used
// type first (ties: type added to the collection first). An item's use time
// falls back to its last edit when it has never been used. Limited to
// `collectionIds` when given.
function getTypeUsage(userId: string, collectionIds?: string[]) {
  const scope = collectionIds
    ? Prisma.sql`AND ic."collectionId" IN (${Prisma.join(collectionIds)})`
    : Prisma.empty;
  return prisma.$queryRaw<CollectionTypeUsage[]>`
    SELECT
      ic."collectionId",
      t."id" AS "typeId",
      t."name" AS "typeName",
      t."icon" AS "typeIcon",
      t."color" AS "typeColor",
      MAX(COALESCE(i."lastUsedAt", i."updatedAt")) AS "lastUsedAt"
    FROM "ItemCollection" ic
    JOIN "Collection" c ON c."id" = ic."collectionId"
    JOIN "Item" i ON i."id" = ic."itemId"
    JOIN "ItemType" t ON t."id" = i."typeId"
    WHERE c."userId" = ${userId} ${scope}
    GROUP BY ic."collectionId", t."id"
    ORDER BY COUNT(*) DESC, MIN(ic."addedAt") ASC
  `;
}

function toCollectionsWithTypes(
  collections: CollectionCardRow[],
  typeUsage: CollectionTypeUsage[],
): CollectionWithTypes[] {
  const usageByCollection = Map.groupBy(typeUsage, (row) => row.collectionId);

  return collections.map(({ _count, ...collection }) => {
    const usage = usageByCollection.get(collection.id) ?? [];
    const types: CollectionType[] = usage.map((row) => ({
      id: row.typeId,
      name: row.typeName,
      icon: row.typeIcon ?? DEFAULT_TYPE_ICON,
      color: row.typeColor ?? DEFAULT_TYPE_COLOR,
    }));
    const lastUsedAt = usage.reduce(
      (latest, row) => (row.lastUsedAt > latest ? row.lastUsedAt : latest),
      collection.updatedAt,
    );

    return { ...collection, itemCount: _count.items, types, lastUsedAt };
  });
}

// Cached per request, since the dashboard page and sidebar both need it.
const getCollectionsByRecentUse = cache(
  async (userId: string): Promise<CollectionWithTypes[]> => {
    const [collections, typeUsage] = await Promise.all([
      prisma.collection.findMany({ where: { userId }, select: COLLECTION_CARD_SELECT }),
      getTypeUsage(userId),
    ]);

    return toCollectionsWithTypes(collections, typeUsage).sort(
      (a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime(),
    );
  },
);

// One page of the user's collections, most recently used first (the same order
// as getCollectionsByRecentUse, worked out in the database so only the page's
// collections are loaded)
export async function getCollectionsPage(
  userId: string,
  { skip, take }: PageRange,
): Promise<Page<CollectionWithTypes>> {
  const [ordered, total] = await Promise.all([
    prisma.$queryRaw<{ id: string }[]>`
      SELECT c."id"
      FROM "Collection" c
      LEFT JOIN "ItemCollection" ic ON ic."collectionId" = c."id"
      LEFT JOIN "Item" i ON i."id" = ic."itemId"
      WHERE c."userId" = ${userId}
      GROUP BY c."id"
      ORDER BY GREATEST(c."updatedAt", MAX(COALESCE(i."lastUsedAt", i."updatedAt"))) DESC,
        c."id" DESC
      LIMIT ${take} OFFSET ${skip}
    `,
    prisma.collection.count({ where: { userId } }),
  ]);
  const ids = ordered.map((row) => row.id);
  if (ids.length === 0) return { rows: [], total };

  const [collections, typeUsage] = await Promise.all([
    prisma.collection.findMany({
      where: { userId, id: { in: ids } },
      select: COLLECTION_CARD_SELECT,
    }),
    getTypeUsage(userId, ids),
  ]);
  const position = new Map(ids.map((id, index) => [id, index]));
  const rows = toCollectionsWithTypes(collections, typeUsage).sort(
    (a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0),
  );
  return { rows, total };
}

// Every favorited collection, most recently updated first (there's no favorited-at
// time, so updatedAt stands in for when it was favorited)
export async function getFavoriteCollections(userId: string): Promise<CollectionWithTypes[]> {
  const collections = await prisma.collection.findMany({
    where: { userId, isFavorite: true },
    select: COLLECTION_CARD_SELECT,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });
  if (collections.length === 0) return [];

  const typeUsage = await getTypeUsage(
    userId,
    collections.map((collection) => collection.id),
  );
  return toCollectionsWithTypes(collections, typeUsage);
}

export async function getCollectionStats(userId: string): Promise<CollectionStats> {
  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);
  return { total, favorites };
}

export interface CreatedCollection {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

// The owner always comes from the session, never from the client
export async function createCollection(
  userId: string,
  data: CreateCollectionData,
): Promise<CreatedCollection> {
  return prisma.collection.create({
    data: { userId, name: data.name, description: data.description },
    select: { id: true, name: true, description: true, createdAt: true },
  });
}

// Updates the owner's collection; null when it's missing or someone else's
export async function updateCollection(
  userId: string,
  id: string,
  data: UpdateCollectionData,
): Promise<CollectionSummary | null> {
  try {
    return await prisma.collection.update({
      where: { id, userId },
      data: { name: data.name, description: data.description },
      select: COLLECTION_SUMMARY_SELECT,
    });
  } catch (error) {
    if (isRecordNotFound(error)) return null;
    throw error;
  }
}

// Sets the owner's collection's favorite flag and returns it; null when the
// collection is missing or someone else's
export async function setCollectionFavorite(
  userId: string,
  id: string,
  isFavorite: boolean,
): Promise<boolean | null> {
  try {
    const collection = await prisma.collection.update({
      where: { id, userId },
      data: { isFavorite },
      select: { isFavorite: true },
    });
    return collection.isFavorite;
  } catch (error) {
    if (isRecordNotFound(error)) return null;
    throw error;
  }
}

// Deletes the owner's collection; false when it's missing or someone else's.
// Its items are kept: only their ItemCollection links go, through the cascade.
export async function deleteCollection(userId: string, id: string): Promise<boolean> {
  try {
    await prisma.collection.delete({ where: { id, userId }, select: { id: true } });
    return true;
  } catch (error) {
    if (isRecordNotFound(error)) return false;
    throw error;
  }
}

// The user's collections by name, for the item forms' collection picker. Cached
// per request, since the top bar and the item drawer both need it.
export const getCollectionOptions = cache(
  async (userId: string): Promise<CollectionOption[]> =>
    prisma.collection.findMany({
      where: { userId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
);

// Whether every id is one of the user's collections, so an item is never linked
// to someone else's
export async function ownsCollections(userId: string, collectionIds: string[]): Promise<boolean> {
  if (collectionIds.length === 0) return true;
  const owned = await prisma.collection.count({
    where: { userId, id: { in: collectionIds } },
  });
  return owned === collectionIds.length;
}
