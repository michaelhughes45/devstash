// A created collection as returned to the client (dates as ISO strings)
export interface CollectionData {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}
