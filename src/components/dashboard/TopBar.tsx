import { Search } from "lucide-react";

import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getCreatableItemTypes } from "@/lib/db/item-types";

export async function TopBar() {
  const creatableTypes = await getCreatableItemTypes();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 sm:gap-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
      </div>
      <div className="relative w-full max-w-md min-w-0">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search items..."
          aria-label="Search items"
          className="h-9 pl-8 sm:pr-14"
        />
        <KbdGroup className="absolute top-1/2 right-2 -translate-y-1/2 max-sm:hidden">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </div>
      {/* Labels collapse to icons on phones so both buttons fit beside the search */}
      <div className="ml-auto flex items-center gap-2">
        <NewCollectionDialog />
        <NewItemDialog types={creatableTypes} />
      </div>
    </header>
  );
}
