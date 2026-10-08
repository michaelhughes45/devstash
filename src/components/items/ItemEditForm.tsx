"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { updateItem } from "@/actions/items";
import { ItemFormFields } from "@/components/items/ItemFormFields";
import { Button } from "@/components/ui/button";
import {
  buildItemInput,
  getEditableFields,
  type ItemFormValues,
} from "@/lib/item-content";
import type { FieldErrors } from "@/types/forms";
import type { ItemDetailData } from "@/types/items";

interface ItemEditFormProps {
  item: ItemDetailData;
  onCancel: () => void;
  onSaved: (item: ItemDetailData) => void;
  // Read-only sections shown under the fields (collections, dates)
  children?: ReactNode;
}

export function ItemEditForm({ item, onCancel, onSaved, children }: ItemEditFormProps) {
  const router = useRouter();
  const fields = getEditableFields(item);
  const [values, setValues] = useState<ItemFormValues>({
    title: item.title,
    description: item.description ?? "",
    content: item.content ?? "",
    language: item.language ?? "",
    url: item.url ?? "",
    tags: item.tags.join(", "),
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  function handleChange(field: keyof ItemFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = await updateItem(item.id, buildItemInput(values, fields));
        if (!result.success) {
          setFieldErrors(result.fieldErrors ?? {});
          toast.error(result.error);
          return;
        }
        toast.success("Item saved");
        onSaved(result.data);
        router.refresh();
      } catch {
        toast.error("Couldn't save the item. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
      <div className="flex items-center gap-1 border-b px-4 pb-4">
        <Button type="submit" disabled={!values.title.trim() || isPending}>
          <Check />
          {isPending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
          <X />
          Cancel
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        <fieldset disabled={isPending} className="flex flex-col gap-5">
          <ItemFormFields
            idPrefix="item"
            values={values}
            onChange={handleChange}
            fields={fields}
            fieldErrors={fieldErrors}
          />
        </fieldset>

        {children}
      </div>
    </form>
  );
}
