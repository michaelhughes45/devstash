"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { createItem } from "@/actions/items";
import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { FileUpload } from "@/components/items/FileUpload";
import { ItemFormFields, type FieldErrors } from "@/components/items/ItemFormFields";
import { Button } from "@/components/ui/button";
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
import { isFileItemType, type FileItemType } from "@/lib/file-constraints";
import {
  EMPTY_ITEM_FORM_VALUES,
  buildItemInput,
  getCreateFields,
  type CreatableItemType,
  type ItemFormValues,
} from "@/lib/item-content";
import { uploadFile } from "@/lib/upload-file";
import { cn } from "@/lib/utils";
import { updateItemSchema } from "@/lib/validations/items";
import type { CreatableItemTypeOption } from "@/types/items";

interface TypeSelectorProps {
  types: CreatableItemTypeOption[];
  value: CreatableItemType;
  onChange: (type: CreatableItemType) => void;
}

// Native radios styled as chips, so arrow keys move between types
function TypeSelector({ types, value, onChange }: TypeSelectorProps) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm leading-none font-medium">Type</legend>
      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <label
            key={type.name}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors hover:bg-muted has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
              value === type.name && "border-foreground/40 bg-muted",
            )}
          >
            <input
              type="radio"
              name="item-type"
              value={type.name}
              checked={value === type.name}
              onChange={() => onChange(type.name)}
              className="sr-only"
            />
            <ItemTypeIcon icon={type.icon} className="size-4" style={{ color: type.color }} />
            {type.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface NewItemFormProps {
  types: CreatableItemTypeOption[];
  isPending: boolean;
  startTransition: (action: () => Promise<void>) => void;
  onCreated: () => void;
}

function withoutFileError(errors: FieldErrors): FieldErrors {
  return Object.fromEntries(Object.entries(errors).filter(([field]) => field !== "file"));
}

// Uploads the chosen file, reporting progress; returns its R2 key, or null after
// showing the error
async function uploadChosenFile(
  type: FileItemType,
  file: File,
  setProgress: (percent: number | null) => void,
  setFieldErrors: (errors: FieldErrors) => void,
): Promise<string | null> {
  setProgress(0);
  const upload = await uploadFile(type, file, setProgress);
  setProgress(null);
  if (upload.success) return upload.key;

  setFieldErrors({ file: [upload.error] });
  toast.error(upload.error);
  return null;
}

// Mounted only while the dialog is open, so each opening starts blank
function NewItemForm({ types, isPending, startTransition, onCreated }: NewItemFormProps) {
  const router = useRouter();
  const [type, setType] = useState<CreatableItemType>(types[0]?.name ?? "snippet");
  const [values, setValues] = useState<ItemFormValues>(EMPTY_ITEM_FORM_VALUES);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const fields = getCreateFields(type);
  const fileType = isFileItemType(type) ? type : null;
  const canSubmit =
    values.title.trim() !== "" &&
    (!fields.url || values.url.trim() !== "") &&
    (!fileType || file !== null);

  function handleChange(field: keyof ItemFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  // Files and images have different rules, so a chosen file doesn't carry over
  function handleTypeChange(nextType: CreatableItemType) {
    setType(nextType);
    setFile(null);
    setFieldErrors(withoutFileError);
  }

  async function submit() {
    const input = buildItemInput(values, fields);
    let fileKey: string | undefined;
    if (fileType && file) {
      // Check the other fields first, so a rejected form doesn't upload for nothing
      const check = updateItemSchema.safeParse(input);
      if (!check.success) {
        setFieldErrors(z.flattenError(check.error).fieldErrors);
        toast.error("Please fix the highlighted fields.");
        return;
      }
      const key = await uploadChosenFile(fileType, file, setProgress, setFieldErrors);
      if (!key) return;
      fileKey = key;
    }

    const result = await createItem({ type, ...input, fileKey });
    if (!result.success) {
      setFieldErrors(result.fieldErrors ?? {});
      toast.error(result.error);
      return;
    }
    onCreated();
    toast.success("Item created");
    router.refresh();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        await submit();
      } catch {
        setProgress(null);
        toast.error("Couldn't create the item. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-4" noValidate>
      <fieldset
        disabled={isPending}
        className="-mx-4 flex min-h-0 flex-col gap-5 overflow-y-auto px-4 py-1"
      >
        <TypeSelector types={types} value={type} onChange={handleTypeChange} />
        {fileType && (
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
                setFieldErrors(withoutFileError);
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
          fieldErrors={fieldErrors}
        />
      </fieldset>

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
}

export function NewItemDialog({ types }: NewItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    // Stay open until the create finishes, so a half-saved item isn't hidden
    if (!isPending) setOpen(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Label collapses to an icon on phones so it fits beside the search */}
      <DialogTrigger render={<Button size="lg" className="max-sm:w-9 max-sm:px-0" />}>
        <Plus data-icon="inline-start" />
        <span className="max-sm:sr-only">New Item</span>
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
          isPending={isPending}
          startTransition={startTransition}
          onCreated={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
