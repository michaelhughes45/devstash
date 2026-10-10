import Link from "next/link";
import { Star } from "lucide-react";

import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { CommandPalette } from "@/components/search/CommandPalette";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getCreatableItemTypes } from "@/lib/db/item-types";
import type { CollectionOption } from "@/types/collections";
import type { SearchData } from "@/types/search";

interface TopBarProps {
  collections: CollectionOption[];
  searchData: SearchData;
}

export async function TopBar({ collections, searchData }: TopBarProps) {
  const creatableTypes = await getCreatableItemTypes();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 sm:gap-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
      </div>
      <CommandPalette data={searchData} />
      {/* Labels collapse to icons on phones so both buttons fit beside the search */}
      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/favorites"
          aria-label="Favorites"
          title="Favorites"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <Star />
        </Link>
        <NewCollectionDialog />
        <NewItemDialog types={creatableTypes} collections={collections} />
      </div>
    </header>
  );
}
