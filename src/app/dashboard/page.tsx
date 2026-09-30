import Link from "next/link";
import { Clock, Pin } from "lucide-react";

import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { StatsCards } from "@/components/dashboard/StatsCards";
import {
  getCollectionStats,
  getDemoUserId,
  getRecentCollections,
} from "@/lib/db/collections";
import { getItemStats, getPinnedItems, getRecentItems } from "@/lib/db/items";

// Render per request so the dashboard reflects the current database state
export const dynamic = "force-dynamic";

const RECENT_COLLECTIONS_LIMIT = 6;
const PINNED_ITEMS_LIMIT = 10;
const RECENT_ITEMS_LIMIT = 10;
const EMPTY_STATS = { total: 0, favorites: 0 };

export default async function DashboardPage() {
  const userId = await getDemoUserId();
  const [recentCollections, collectionStats, pinnedItems, recentItems, itemStats] =
    userId
      ? await Promise.all([
          getRecentCollections(userId, RECENT_COLLECTIONS_LIMIT),
          getCollectionStats(userId),
          getPinnedItems(userId, PINNED_ITEMS_LIMIT),
          getRecentItems(userId, RECENT_ITEMS_LIMIT),
          getItemStats(userId),
        ])
      : [[], EMPTY_STATS, [], [], EMPTY_STATS];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your developer knowledge hub</p>
      </div>

      <StatsCards itemStats={itemStats} collectionStats={collectionStats} />

      <DashboardSection
        title="Collections"
        action={
          <Link
            href="/collections"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        }
      >
        {recentCollections.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recentCollections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No collections yet.</p>
        )}
      </DashboardSection>

      {pinnedItems.length > 0 && (
        <DashboardSection title="Pinned" icon={Pin}>
          <div className="flex flex-col gap-3">
            {pinnedItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </DashboardSection>
      )}

      <DashboardSection title="Recent Items" icon={Clock}>
        {recentItems.length > 0 ? (
          <div className="flex flex-col gap-3">
            {recentItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No items yet.</p>
        )}
      </DashboardSection>
    </div>
  );
}
