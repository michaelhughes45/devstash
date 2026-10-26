import Link from "next/link";
import { Star, Zap } from "lucide-react";

import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { CommandPalette } from "@/components/search/CommandPalette";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getCreatableItemTypes } from "@/lib/db/item-types";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import type { CollectionOption } from "@/types/collections";
import type { SearchData } from "@/types/search";

interface TopBarProps {
  collections: CollectionOption[];
  searchData: SearchData;
}

export async function TopBar({ collections, searchData }: TopBarProps) {
  const [creatableTypes, user] = await Promise.all([getCreatableItemTypes(), getCurrentUser()]);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 sm:gap-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="max-sm:size-9" />
        <Separator orientation="vertical" className="h-6" />
      </div>
      <CommandPalette data={searchData} />
      {/* Labels collapse to icons below lg so the search keeps its width beside the sidebar */}
      <div className="ml-auto flex items-center gap-2">
        {user && !user.isPro && (
          <Link
            href="/upgrade"
            title="Upgrade to Pro"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "text-muted-foreground max-lg:w-9 max-lg:px-0",
            )}
          >
            <Zap />
            <span className="max-lg:sr-only">Upgrade</span>
          </Link>
        )}
        <Link
          href="/favorites"
          aria-label="Favorites"
          title="Favorites"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <Star />
        </Link>
        <NewCollectionDialog />
        <NewItemDialog
          types={creatableTypes}
          collections={collections}
          isPro={user?.isPro ?? false}
        />
      </div>
    </header>
  );
}
