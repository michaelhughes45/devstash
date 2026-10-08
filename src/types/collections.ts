// A created collection as returned to the client (dates as ISO strings)
export interface CollectionData {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

// A collection the item forms' picker offers
export interface CollectionOption {
  id: string;
  name: string;
}

// A collection's metadata, as shown on its page and edited by the edit dialog
export interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
}
