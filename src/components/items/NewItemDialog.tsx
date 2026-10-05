"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createItem } from "@/actions/items";
import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { ItemFormFields, type FieldErrors } from "@/components/items/ItemFormFields";
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
import {
  EMPTY_ITEM_FORM_VALUES,
  buildItemInput,
  getCreateFields,
  type CreatableItemType,
  type ItemFormValues,
} from "@/lib/item-content";
import { cn } from "@/lib/utils";
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

// Mounted only while the dialog is open, so each opening starts blank
function NewItemForm({ types, isPending, startTransition, onCreated }: NewItemFormProps) {
  const router = useRouter();
  const [type, setType] = useState<CreatableItemType>(types[0]?.name ?? "snippet");
  const [values, setValues] = useState<ItemFormValues>(EMPTY_ITEM_FORM_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const fields = getCreateFields(type);
  const canSubmit = values.title.trim() !== "" && (!fields.url || values.url.trim() !== "");

  function handleChange(field: keyof ItemFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = await createItem({ type, ...buildItemInput(values, fields) });
        if (!result.success) {
          setFieldErrors(result.fieldErrors ?? {});
          toast.error(result.error);
          return;
        }
        onCreated();
        toast.success("Item created");
        router.refresh();
      } catch {
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
        <TypeSelector types={types} value={type} onChange={setType} />
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
          {isPending ? "Creating…" : "Create"}
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
