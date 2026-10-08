"use client";

import { useState } from "react";
import { Pencil, Star, Trash2 } from "lucide-react";

import { DeleteCollectionDialog } from "@/components/collections/DeleteCollectionDialog";
import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";
import { Button } from "@/components/ui/button";
import type { CollectionSummary } from "@/types/collections";

// Labels collapse to icons on narrow screens
function ActionLabel({ children }: { children: string }) {
  return <span className="max-sm:sr-only">{children}</span>;
}

// The collection page's actions. Favorite shows state only; its behavior comes
// in the favorites spec.
export function CollectionActions({ collection }: { collection: CollectionSummary }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        aria-pressed={collection.isFavorite}
        className={collection.isFavorite ? "text-yellow-400 hover:text-yellow-400" : undefined}
      >
        <Star className={collection.isFavorite ? "fill-yellow-400" : undefined} />
        <ActionLabel>Favorite</ActionLabel>
      </Button>
      <Button variant="ghost" onClick={() => setEditOpen(true)}>
        <Pencil />
        <ActionLabel>Edit</ActionLabel>
      </Button>
      <Button
        variant="ghost"
        onClick={() => setDeleteOpen(true)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 />
        <ActionLabel>Delete</ActionLabel>
      </Button>

      <EditCollectionDialog collection={collection} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteCollectionDialog
        collection={collection}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        redirectTo="/collections"
      />
    </div>
  );
}
