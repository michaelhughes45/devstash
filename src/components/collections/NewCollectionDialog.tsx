"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";

import { createCollection } from "@/actions/collections";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FieldErrors } from "@/types/forms";

interface NewCollectionFormProps {
  isPending: boolean;
  startTransition: (action: () => Promise<void>) => void;
  onCreated: () => void;
}

// Mounted only while the dialog is open, so each opening starts blank
function NewCollectionForm({ isPending, startTransition, onCreated }: NewCollectionFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function submit() {
    try {
      const result = await createCollection({ name, description });
      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      onCreated();
      toast.success("Collection created");
      router.refresh();
    } catch {
      toast.error("Couldn't create the collection. Please try again.");
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
          idPrefix="new-collection"
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
          {isPending ? "Creating…" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function NewCollectionDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    // Stay open until the create finishes
    if (!isPending) setOpen(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Label collapses to an icon on phones so it fits beside the search */}
      <DialogTrigger
        render={<Button variant="outline" size="lg" className="max-lg:w-9 max-lg:px-0" />}
      >
        <FolderPlus data-icon="inline-start" />
        <span className="max-lg:sr-only">New Collection</span>
      </DialogTrigger>
      <DialogContent showCloseButton={!isPending} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>Group related items under one name.</DialogDescription>
        </DialogHeader>
        <NewCollectionForm
          isPending={isPending}
          startTransition={startTransition}
          onCreated={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
