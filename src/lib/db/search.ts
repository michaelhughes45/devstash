import { cache } from "react";

import { getAllCollections } from "@/lib/db/collections";
import { DEFAULT_TYPE_COLOR, DEFAULT_TYPE_ICON } from "@/lib/item-type-icons";
import { prisma } from "@/lib/prisma";
import { toSearchPreview } from "@/lib/search-preview";
import type { SearchData, SearchItem } from "@/types/search";

// Most recently edited items the palette can search; keeps the page payload
// bounded for very large accounts
export const SEARCH_ITEM_LIMIT = 1000;

// Characters of text read per item before the preview is cut down further
const PREVIEW_SOURCE_LENGTH = 300;

interface SearchItemRow {
  id: string;
  title: string;
  previewSource: string | null;
  typeId: string;
  typeName: string;
  typeIcon: string | null;
  typeColor: string | null;
}

// Only the start of each item's text is read, so long items aren't loaded in full
export async function getSearchItems(userId: string): Promise<SearchItem[]> {
  const rows = await prisma.$queryRaw<SearchItemRow[]>`
    SELECT
      i."id",
      i."title",
      LEFT(COALESCE(i."content", i."url", i."fileName", i."description"), ${PREVIEW_SOURCE_LENGTH}::int) AS "previewSource",
      t."id" AS "typeId",
      t."name" AS "typeName",
      t."icon" AS "typeIcon",
      t."color" AS "typeColor"
    FROM "Item" i
    JOIN "ItemType" t ON t."id" = i."typeId"
    WHERE i."userId" = ${userId}
    ORDER BY i."updatedAt" DESC
    LIMIT ${SEARCH_ITEM_LIMIT}
  `;

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    preview: toSearchPreview(row.previewSource),
    type: {
      id: row.typeId,
      name: row.typeName,
      icon: row.typeIcon ?? DEFAULT_TYPE_ICON,
      color: row.typeColor ?? DEFAULT_TYPE_COLOR,
    },
  }));
}

// Everything the command palette searches. Collections reuse the request-cached
// query the sidebar already runs; cached per request like it.
export const getSearchData = cache(async (userId: string): Promise<SearchData> => {
  const [items, collections] = await Promise.all([
    getSearchItems(userId),
    getAllCollections(userId),
  ]);

  return {
    items,
    collections: collections.map(({ id, name, itemCount }) => ({ id, name, itemCount })),
  };
});
