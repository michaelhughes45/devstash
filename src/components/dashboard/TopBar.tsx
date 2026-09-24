import { FolderPlus, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
      </div>
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search items..."
          aria-label="Search items"
          className="h-9 pr-14 pl-8"
        />
        <KbdGroup className="absolute top-1/2 right-2 -translate-y-1/2">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="lg">
          <FolderPlus data-icon="inline-start" />
          New Collection
        </Button>
        <Button size="lg">
          <Plus data-icon="inline-start" />
          New Item
        </Button>
      </div>
    </header>
  );
}
