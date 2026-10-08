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
