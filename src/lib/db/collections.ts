import { prisma } from "@/lib/prisma";

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

const DEFAULT_TYPE_ICON = "File";
const DEFAULT_TYPE_COLOR = "#6b7280";

// Temporary until auth is in place: the dashboard shows the seeded demo user's data.
export const DEMO_USER_EMAIL = "demo@devstash.io";

export async function getDemoUserId(): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function getRecentCollections(
  userId: string,
  limit: number,
): Promise<CollectionWithTypes[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      updatedAt: true,
      items: {
        select: {
          item: {
            select: {
              lastUsedAt: true,
              updatedAt: true,
              type: { select: { id: true, name: true, icon: true, color: true } },
            },
          },
        },
      },
    },
  });

  return collections
    .map(({ items, ...collection }) => {
      const typeCounts = new Map<string, { type: CollectionType; count: number }>();
      let lastUsedAt = collection.updatedAt;

      for (const { item } of items) {
        const entry = typeCounts.get(item.type.id);
        if (entry) {
          entry.count++;
        } else {
          typeCounts.set(item.type.id, {
            type: {
              id: item.type.id,
              name: item.type.name,
              icon: item.type.icon ?? DEFAULT_TYPE_ICON,
              color: item.type.color ?? DEFAULT_TYPE_COLOR,
            },
            count: 1,
          });
        }

        const itemUsedAt = item.lastUsedAt ?? item.updatedAt;
        if (itemUsedAt > lastUsedAt) lastUsedAt = itemUsedAt;
      }

      const types = [...typeCounts.values()]
        .sort((a, b) => b.count - a.count)
        .map(({ type }) => type);

      return { ...collection, itemCount: items.length, types, lastUsedAt };
    })
    .sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime())
    .slice(0, limit);
}

export async function getCollectionStats(userId: string): Promise<CollectionStats> {
  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);
  return { total, favorites };
}
