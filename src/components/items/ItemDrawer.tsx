"use client";

import type { ReactNode } from "react";
import { Calendar, FolderOpen, Tag } from "lucide-react";

import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { ItemDrawerActions } from "@/components/items/ItemDrawerActions";
import { ItemDrawerContent } from "@/components/items/ItemDrawerContent";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { ItemDetailData, ItemPreview } from "@/types/items";

export type ItemDrawerState =
  | { status: "loading"; preview: ItemPreview }
  | { status: "loaded"; preview: ItemPreview; item: ItemDetailData }
  | { status: "error"; preview: ItemPreview; error: string };

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

interface ItemDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: ItemDrawerState | null;
}

export function ItemDrawer({ open, onOpenChange, state }: ItemDrawerProps) {
  const item = state?.status === "loaded" ? state.item : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        {state && (
          <>
            <DrawerHeader preview={state.preview} language={item?.language ?? null} />
            <ItemDrawerActions item={item} />
            <div className="flex-1 overflow-y-auto p-6">
              {state.status === "loading" && <DrawerSkeleton />}
              {state.status === "error" && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
              {item && <DrawerBody item={item} />}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface DrawerHeaderProps {
  preview: ItemPreview;
  language: string | null;
}

function DrawerHeader({ preview, language }: DrawerHeaderProps) {
  const { type } = preview;

  return (
    <SheetHeader className="flex-row items-start gap-3 p-6 pr-12 pb-4">
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted"
        style={{ color: type.color }}
      >
        <ItemTypeIcon icon={type.icon} className="size-5" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <SheetTitle className="text-lg font-semibold break-words">
          {preview.title}
        </SheetTitle>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{capitalize(type.name)}</Badge>
          {language && <Badge variant="outline">{language}</Badge>}
        </div>
      </div>
    </SheetHeader>
  );
}

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading item">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-48 w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

interface DrawerSectionProps {
  title: string;
  icon?: typeof Tag;
  children: ReactNode;
}

function DrawerSection({ title, icon: Icon, children }: DrawerSectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="size-4" aria-hidden />}
        {title}
      </h3>
      {children}
    </section>
  );
}

function DrawerBody({ item }: { item: ItemDetailData }) {
  return (
    <div className="flex flex-col gap-6">
      {item.description && (
        <DrawerSection title="Description">
          <p className="text-sm whitespace-pre-wrap">{item.description}</p>
        </DrawerSection>
      )}

      <DrawerSection title="Content">
        <ItemDrawerContent item={item} />
      </DrawerSection>

      {item.tags.length > 0 && (
        <DrawerSection title="Tags" icon={Tag}>
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </DrawerSection>
      )}

      {item.collections.length > 0 && (
        <DrawerSection title="Collections" icon={FolderOpen}>
          <div className="flex flex-wrap gap-1.5">
            {item.collections.map((collection) => (
              <Badge key={collection.id} variant="outline">
                {collection.name}
              </Badge>
            ))}
          </div>
        </DrawerSection>
      )}

      <DrawerSection title="Details" icon={Calendar}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Created</dt>
          <dd className="text-right">{DATE_FORMAT.format(new Date(item.createdAt))}</dd>
          <dt className="text-muted-foreground">Updated</dt>
          <dd className="text-right">{DATE_FORMAT.format(new Date(item.updatedAt))}</dd>
        </dl>
      </DrawerSection>
    </div>
  );
}
