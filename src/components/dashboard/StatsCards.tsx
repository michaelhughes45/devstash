import { Folder, FolderHeart, Layers, Star, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { CollectionStats } from "@/lib/db/collections";
import { items } from "@/lib/mock-data";

interface Stat {
  label: string;
  value: number;
  icon: LucideIcon;
}

interface StatsCardsProps {
  collectionStats: CollectionStats;
}

export function StatsCards({ collectionStats }: StatsCardsProps) {
  // Item stats stay on mock data until items are moved to the database
  const stats: Stat[] = [
    { label: "Items", value: items.length, icon: Layers },
    { label: "Collections", value: collectionStats.total, icon: Folder },
    {
      label: "Favorite Items",
      value: items.filter((item) => item.isFavorite).length,
      icon: Star,
    },
    {
      label: "Favorite Collections",
      value: collectionStats.favorites,
      icon: FolderHeart,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardContent className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold">{value}</p>
            </div>
            <Icon className="size-5 shrink-0 text-muted-foreground" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
