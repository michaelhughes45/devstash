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
import { items } from "@/lib/mock-data";

// Render per request so collections reflect the current database state
export const dynamic = "force-dynamic";

const RECENT_COLLECTIONS_LIMIT = 6;
const RECENT_ITEMS_LIMIT = 10;

export default async function DashboardPage() {
  const userId = await getDemoUserId();
  const [recentCollections, collectionStats] = userId
    ? await Promise.all([
        getRecentCollections(userId, RECENT_COLLECTIONS_LIMIT),
        getCollectionStats(userId),
      ])
    : [[], { total: 0, favorites: 0 }];
  const pinnedItems = items.filter((item) => item.isPinned);
  const recentItems = [...items]
    .sort((a, b) => Date.parse(b.lastUsedAt) - Date.parse(a.lastUsedAt))
    .slice(0, RECENT_ITEMS_LIMIT);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your developer knowledge hub</p>
      </div>

      <StatsCards collectionStats={collectionStats} />

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
        <div className="flex flex-col gap-3">
          {recentItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
