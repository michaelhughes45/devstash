"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { Plus } from "lucide-react";

import { FileUpload } from "@/components/items/FileUpload";
import { ItemFormFields } from "@/components/items/ItemFormFields";
import { TypeSelector } from "@/components/items/TypeSelector";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { useCreateItem } from "@/hooks/use-create-item";
import { isFileItemType } from "@/lib/file-constraints";
import {
  EMPTY_ITEM_FORM_VALUES,
  getCreateFields,
  type CreatableItemType,
  type ItemFormChange,
  type ItemFormValues,
} from "@/lib/item-content";
import { isProOnlyItemType } from "@/lib/item-type-names";
import type { CollectionOption } from "@/types/collections";
import type { CreatableItemTypeOption } from "@/types/items";

interface NewItemFormProps {
  types: CreatableItemTypeOption[];
  collections: CollectionOption[];
  isPro: boolean;
  isPending: boolean;
  startTransition: (action: () => Promise<void>) => void;
  onCreated: () => void;
  onClose: () => void;
}

// Mounted only while the dialog is open, so each opening starts blank
function NewItemForm({
  types,
  collections,
  isPro,
  isPending,
  startTransition,
  onCreated,
  onClose,
}: NewItemFormProps) {
  const [type, setType] = useState<CreatableItemType>(types[0]?.name ?? "snippet");
  const [values, setValues] = useState<ItemFormValues>(EMPTY_ITEM_FORM_VALUES);
  const [file, setFile] = useState<File | null>(null);
  const { progress, fieldErrors, submit, clearFileError } = useCreateItem(onCreated);
  const fields = getCreateFields(type);
  const fileType = isFileItemType(type) ? type : null;
  // The server rejects these too; this just says so before the form is filled in
  const needsPro = !isPro && isProOnlyItemType(type);
  const canSubmit =
    !needsPro &&
    values.title.trim() !== "" &&
    (!fields.url || values.url.trim() !== "") &&
    (!fileType || file !== null);

  const handleChange: ItemFormChange = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  // Files and images have different rules, so a chosen file doesn't carry over
  function handleTypeChange(nextType: CreatableItemType) {
    setType(nextType);
    setFile(null);
    clearFileError();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => submit(type, values, file));
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-4" noValidate>
      {/* The div scrolls rather than the fieldset, which browsers don't scroll as a flex item */}
      <div className="-mx-4 min-h-0 overflow-y-auto px-4 py-1">
        <fieldset disabled={isPending} className="flex flex-col gap-5">
          <TypeSelector types={types} value={type} onChange={handleTypeChange} isPro={isPro} />
          {needsPro && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed p-3 text-sm">
              <p className="text-muted-foreground">Upgrade to Pro to upload files and images.</p>
              <Link
                href="/upgrade"
                onClick={onClose}
                className={buttonVariants({ size: "sm" })}
              >
                Upgrade
              </Link>
            </div>
          )}
          {fileType && !needsPro && (
            <div className="grid gap-2">
              <Label htmlFor="new-item-file">{fileType === "image" ? "Image" : "File"}</Label>
              {/* Keyed by type so switching file ↔ image also resets its own errors */}
              <FileUpload
                key={fileType}
                id="new-item-file"
                type={fileType}
                file={file}
                onFileChange={(next) => {
                  setFile(next);
                  clearFileError();
                }}
                progress={progress}
                error={fieldErrors.file?.[0]}
                disabled={isPending}
              />
            </div>
          )}
          <ItemFormFields
            idPrefix="new-item"
            values={values}
            onChange={handleChange}
            fields={fields}
            collections={collections}
            fieldErrors={fieldErrors}
          />
        </fieldset>
      </div>

      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={isPending} />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={!canSubmit || isPending}>
          {progress !== null ? "Uploading…" : isPending ? "Creating…" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface NewItemDialogProps {
  types: CreatableItemTypeOption[];
  collections: CollectionOption[];
  isPro: boolean;
}

export function NewItemDialog({ types, collections, isPro }: NewItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    // Stay open until the create finishes, so a half-saved item isn't hidden
    if (!isPending) setOpen(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Label collapses to an icon on phones so it fits beside the search */}
      <DialogTrigger render={<Button size="lg" className="max-lg:w-9 max-lg:px-0" />}>
        <Plus data-icon="inline-start" />
        <span className="max-lg:sr-only">New Item</span>
      </DialogTrigger>
      <DialogContent
        showCloseButton={!isPending}
        className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>Choose a type and fill in the details.</DialogDescription>
        </DialogHeader>
        <NewItemForm
          types={types}
          collections={collections}
          isPro={isPro}
          isPending={isPending}
          startTransition={startTransition}
          onCreated={() => setOpen(false)}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
