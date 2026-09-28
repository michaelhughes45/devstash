import Link from "next/link";
import { ArrowRight, Folder, Star } from "lucide-react";

import { SidebarSection } from "@/components/dashboard/SidebarSection";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { CollectionWithTypes, SidebarCollections } from "@/lib/db/collections";

interface CollectionListProps {
  label: string;
  collections: CollectionWithTypes[];
}

function CollectionMarker({ collection }: { collection: CollectionWithTypes }) {
  if (collection.isFavorite) {
    return <Star className="size-4 fill-yellow-400 text-yellow-400" />;
  }

  // Types are sorted most-used first, so the first one sets the color
  const color = collection.types[0]?.color;
  return (
    <span
      className="size-2.5 rounded-full bg-muted-foreground"
      style={{ backgroundColor: color }}
      aria-label={collection.types[0]?.name}
    />
  );
}

function CollectionList({ label, collections }: CollectionListProps) {
  if (collections.length === 0) return null;

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
            <SidebarMenuBadge>
              <CollectionMarker collection={collection} />
            </SidebarMenuBadge>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </>
  );
}

interface CollectionsNavProps {
  collections: SidebarCollections;
}

export function CollectionsNav({ collections }: CollectionsNavProps) {
  return (
    <SidebarSection title="Collections">
      <CollectionList label="Favorites" collections={collections.favorites} />
      <CollectionList label="Recent" collections={collections.recent} />
      <SidebarMenu className="pt-2">
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="View all collections"
            className="text-muted-foreground"
            render={<Link href="/collections" />}
          >
            <ArrowRight />
            <span>View all collections</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarSection>
  );
}
