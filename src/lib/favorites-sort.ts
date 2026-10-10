export const FAVORITE_SORTS = ["date", "name", "type"] as const;

export type FavoriteSort = (typeof FAVORITE_SORTS)[number];

export const FAVORITE_SORT_LABELS: Record<FavoriteSort, string> = {
  date: "Date",
  name: "Name",
  type: "Type",
};

interface FavoriteSortKey {
  id: string;
  name: string;
  date: Date;
  // null sorts last under Type (e.g. a collection with no items)
  typeName: string | null;
}

interface FavoriteItemLike {
  id: string;
  title: string;
  updatedAt: Date;
  type: { name: string };
}

interface FavoriteCollectionLike {
  id: string;
  name: string;
  updatedAt: Date;
  // Most-used first
  types: { name: string }[];
}

// A fixed locale so the server render and the browser agree
const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

function compareText(a: string, b: string): number {
  return collator.compare(a, b);
}

function compareByName(a: FavoriteSortKey, b: FavoriteSortKey): number {
  return compareText(a.name, b.name) || compareText(a.id, b.id);
}

function compareTypeNames(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return compareText(a, b);
}

const COMPARATORS: Record<FavoriteSort, (a: FavoriteSortKey, b: FavoriteSortKey) => number> = {
  date: (a, b) => b.date.getTime() - a.date.getTime() || compareByName(a, b),
  name: compareByName,
  type: (a, b) => compareTypeNames(a.typeName, b.typeName) || compareByName(a, b),
};

// Returns a sorted copy; ties fall back to name, then id, so the order is stable
export function sortFavorites<T>(
  rows: readonly T[],
  sort: FavoriteSort,
  toKey: (row: T) => FavoriteSortKey,
): T[] {
  const compare = COMPARATORS[sort];
  return rows
    .map((row) => ({ row, key: toKey(row) }))
    .sort((a, b) => compare(a.key, b.key))
    .map(({ row }) => row);
}

export function sortFavoriteItems<T extends FavoriteItemLike>(
  items: readonly T[],
  sort: FavoriteSort,
): T[] {
  return sortFavorites(items, sort, (item) => ({
    id: item.id,
    name: item.title,
    date: item.updatedAt,
    typeName: item.type.name,
  }));
}

// Collections sort under Type by their most-used item type
export function sortFavoriteCollections<T extends FavoriteCollectionLike>(
  collections: readonly T[],
  sort: FavoriteSort,
): T[] {
  return sortFavorites(collections, sort, (collection) => ({
    id: collection.id,
    name: collection.name,
    date: collection.updatedAt,
    typeName: collection.types[0]?.name ?? null,
  }));
}
