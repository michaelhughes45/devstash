import type { ItemCardType } from "@/lib/db/items";

// An item the command palette can find; `type` also fills the drawer header
export interface SearchItem {
  id: string;
  title: string;
  type: ItemCardType;
  // Short, single-line start of the content (or URL, file name or description)
  preview: string;
}

export interface SearchCollection {
  id: string;
  name: string;
  itemCount: number;
}

// Loaded once per page render and searched in the browser
export interface SearchData {
  items: SearchItem[];
  collections: SearchCollection[];
}
