"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteCollection } from "@/actions/collections";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { CollectionSummary } from "@/types/collections";

interface DeleteCollectionDialogProps {
  collection: CollectionSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Where to go afterwards, when the current page is the collection's own
  redirectTo?: string;
}

export function DeleteCollectionDialog({
  collection,
  open,
  onOpenChange,
  redirectTo,
}: DeleteCollectionDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    // Stay open until the delete finishes, so Cancel can't race it
    if (!isPending) onOpenChange(nextOpen);
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        const result = await deleteCollection(collection.id);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        onOpenChange(false);
        toast.success("Collection deleted");
        if (redirectTo) router.replace(redirectTo);
        router.refresh();
      } catch {
        toast.error("Couldn't delete the collection. Please try again.");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="break-words">
            Delete &ldquo;{collection.name}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This deletes the collection. Its items are kept and just won&apos;t be in this
            collection anymore. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={isPending} onClick={handleDelete}>
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
