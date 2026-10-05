import type { ItemCardType, ItemDetail } from "@/lib/db/items";

// Card fields shown in the drawer header while the full item loads
export interface ItemPreview {
  id: string;
  title: string;
  type: ItemCardType;
}

// ItemDetail as received from GET /api/items/[id], with dates as ISO strings
export type ItemDetailData = Omit<ItemDetail, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};
