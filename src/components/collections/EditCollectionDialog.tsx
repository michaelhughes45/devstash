"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateCollection } from "@/actions/collections";
import { CollectionFormFields } from "@/components/collections/CollectionFormFields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CollectionSummary } from "@/types/collections";
import type { FieldErrors } from "@/types/forms";

interface EditCollectionFormProps {
  collection: CollectionSummary;
  isPending: boolean;
  startTransition: (action: () => Promise<void>) => void;
  onSaved: () => void;
}

// Mounted only while the dialog is open, so each opening starts from the saved values
function EditCollectionForm({
  collection,
  isPending,
  startTransition,
  onSaved,
}: EditCollectionFormProps) {
  const router = useRouter();
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function submit() {
    try {
      const result = await updateCollection(collection.id, { name, description });
      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      onSaved();
      toast.success("Collection saved");
      router.refresh();
    } catch {
      toast.error("Couldn't save the collection. Please try again.");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(submit);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <fieldset disabled={isPending} className="flex flex-col gap-5">
        <CollectionFormFields
          idPrefix="edit-collection"
          name={name}
          description={description}
          fieldErrors={fieldErrors}
          onNameChange={setName}
          onDescriptionChange={setDescription}
        />
      </fieldset>

      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={isPending} />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={name.trim() === "" || isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface EditCollectionDialogProps {
  collection: CollectionSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCollectionDialog({
  collection,
  open,
  onOpenChange,
}: EditCollectionDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    // Stay open until the save finishes
    if (!isPending) onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!isPending} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit collection</DialogTitle>
          <DialogDescription>Change the collection&apos;s name or description.</DialogDescription>
        </DialogHeader>
        <EditCollectionForm
          collection={collection}
          isPending={isPending}
          startTransition={startTransition}
          onSaved={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
