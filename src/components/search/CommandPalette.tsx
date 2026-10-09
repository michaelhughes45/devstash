"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderIcon, Search } from "lucide-react";

import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { fuzzySearch } from "@/lib/fuzzy-search";
import { capitalize } from "@/lib/item-type-names";
import type { SearchCollection, SearchData, SearchItem } from "@/types/search";

// Results shown per group; the rest are reached by typing more
const ITEM_RESULT_LIMIT = 8;
const COLLECTION_RESULT_LIMIT = 5;

function itemFields(item: SearchItem) {
  return [
    { text: item.title, weight: 3 },
    { text: item.type.name, weight: 1 },
    { text: item.preview, weight: 1, fuzzy: false },
  ];
}

function collectionFields(collection: SearchCollection) {
  return [{ text: collection.name, weight: 3 }];
}

interface CommandPaletteProps {
  data: SearchData;
}

// The top bar's search box: opens a palette (also on ⌘K / Ctrl+K) that
// searches the preloaded items and collections in the browser
export function CommandPalette({ data }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { openItem } = useItemDrawer();
  // Opened once the palette has finished closing, so the two dialogs don't
  // fight over focus (selecting with Enter otherwise closes the drawer again)
  const pendingItemRef = useRef<SearchItem | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const items = useMemo(
    () => fuzzySearch(data.items, query, itemFields, ITEM_RESULT_LIMIT),
    [data.items, query],
  );
  const collections = useMemo(
    () => fuzzySearch(data.collections, query, collectionFields, COLLECTION_RESULT_LIMIT),
    [data.collections, query],
  );

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    // Each opening starts with an empty search
    if (!nextOpen) setQuery("");
  }

  function handleOpenChangeComplete(nextOpen: boolean) {
    const item = pendingItemRef.current;
    if (nextOpen || !item) return;
    pendingItemRef.current = null;
    openItem({ id: item.id, title: item.title, type: item.type });
  }

  function selectItem(item: SearchItem) {
    pendingItemRef.current = item;
    handleOpenChange(false);
  }

  function selectCollection(collection: SearchCollection) {
    handleOpenChange(false);
    router.push(`/collections/${collection.id}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="flex h-9 w-full max-w-md min-w-0 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm text-muted-foreground transition-colors outline-none hover:bg-input/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">Search items and collections...</span>
        <KbdGroup className="ml-auto max-sm:hidden">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </button>

      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={handleOpenChangeComplete}
      >
        <DialogContent
          showCloseButton={false}
          className="top-[15%] translate-y-0 overflow-hidden p-0 sm:max-w-xl"
        >
          <DialogTitle className="sr-only">Search</DialogTitle>
          <DialogDescription className="sr-only">
            Search your items and collections
          </DialogDescription>
          {/* Filtering is done by fuzzySearch, so cmdk only handles the keyboard */}
          <Command shouldFilter={false} className="rounded-none!">
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search items and collections..."
              aria-label="Search items and collections"
            />
            <CommandList className="max-h-[min(24rem,60dvh)]">
              <CommandEmpty>No results found.</CommandEmpty>
              {items.length > 0 && (
                <CommandGroup heading="Items">
                  {items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`item-${item.id}`}
                      onSelect={() => selectItem(item)}
                    >
                      <ItemTypeIcon
                        icon={item.type.icon}
                        style={{ color: item.type.color }}
                        className="size-4"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{item.title}</p>
                        {item.preview && (
                          <p className="truncate text-xs text-muted-foreground">
                            {item.preview}
                          </p>
                        )}
                      </div>
                      <CommandShortcut className="shrink-0 tracking-normal">
                        {capitalize(item.type.name)}
                      </CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {collections.length > 0 && (
                <CommandGroup heading="Collections">
                  {collections.map((collection) => (
                    <CommandItem
                      key={collection.id}
                      value={`collection-${collection.id}`}
                      onSelect={() => selectCollection(collection)}
                    >
                      <FolderIcon className="text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{collection.name}</span>
                      <CommandShortcut className="shrink-0 tracking-normal">
                        {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                      </CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
