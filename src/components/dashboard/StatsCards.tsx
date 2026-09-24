import { Folder, FolderHeart, Layers, Star, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { collections, items } from "@/lib/mock-data";

interface Stat {
  label: string;
  value: number;
  icon: LucideIcon;
}

const STATS: Stat[] = [
  { label: "Items", value: items.length, icon: Layers },
  { label: "Collections", value: collections.length, icon: Folder },
  {
    label: "Favorite Items",
    value: items.filter((item) => item.isFavorite).length,
    icon: Star,
  },
  {
    label: "Favorite Collections",
    value: collections.filter((collection) => collection.isFavorite).length,
    icon: FolderHeart,
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {STATS.map(({ label, value, icon: Icon }) => (
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
