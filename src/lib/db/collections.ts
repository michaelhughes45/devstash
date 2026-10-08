import { cache } from "react";

import { DEFAULT_TYPE_COLOR, DEFAULT_TYPE_ICON } from "@/lib/item-type-icons";
import { prisma } from "@/lib/prisma";
import type { CreateCollectionData } from "@/lib/validations/collections";
import type { CollectionOption } from "@/types/collections";

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

// Cached per request, since the dashboard page and sidebar both need it.
const getCollectionsByRecentUse = cache(
  async (userId: string): Promise<CollectionWithTypes[]> => {
    const [collections, typeUsage] = await Promise.all([
      prisma.collection.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          description: true,
          isFavorite: true,
          updatedAt: true,
          _count: { select: { items: true } },
        },
      }),
      // Aggregated in the database so item rows aren't loaded. Rows come most-used
      // type first (ties: type added to the collection first). An item's use time
      // falls back to its last edit when it has never been used.
      prisma.$queryRaw<CollectionTypeUsage[]>`
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
        WHERE c."userId" = ${userId}
        GROUP BY ic."collectionId", t."id"
        ORDER BY COUNT(*) DESC, MIN(ic."addedAt") ASC
      `,
    ]);

    const usageByCollection = Map.groupBy(typeUsage, (row) => row.collectionId);

    return collections
      .map(({ _count, ...collection }) => {
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
      })
      .sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime());
  },
);

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
