import Link from "next/link";
import { Folder, Star } from "lucide-react";

import { SidebarSection } from "@/components/dashboard/SidebarSection";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { collections, items, type MockCollection } from "@/lib/mock-data";

// Most recent use of any item in the collection, as a timestamp.
function getLastUsedAt(collectionId: string): number {
  return Math.max(
    0,
    ...items
      .filter((item) => item.collectionIds.includes(collectionId))
      .map((item) => Date.parse(item.lastUsedAt)),
  );
}

interface CollectionListProps {
  label: string;
  collections: MockCollection[];
}

function CollectionList({ label, collections }: CollectionListProps) {
  return (
    <>
      <p className="px-2 pt-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase group-data-[collapsible=icon]:hidden">
        {label}
      </p>
      <SidebarMenu>
        {collections.map((collection) => (
          <SidebarMenuItem key={collection.id}>
            <SidebarMenuButton
              tooltip={collection.name}
              render={<Link href={`/collections/${collection.id}`} />}
            >
              <Folder />
              <span>{collection.name}</span>
            </SidebarMenuButton>
            <SidebarMenuBadge className="text-muted-foreground">
              {collection.isFavorite ? (
                <Star className="size-4 fill-yellow-400 text-yellow-400" />
              ) : (
                collection.itemCount
              )}
            </SidebarMenuBadge>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </>
  );
}

export function CollectionsNav() {
  const favorites = collections.filter((collection) => collection.isFavorite);
  const recent = collections
    .filter((collection) => !collection.isFavorite)
    .sort((a, b) => getLastUsedAt(b.id) - getLastUsedAt(a.id));

  return (
    <SidebarSection title="Collections">
      <CollectionList label="Favorites" collections={favorites} />
      <CollectionList label="Recent" collections={recent} />
    </SidebarSection>
  );
}
