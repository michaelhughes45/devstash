import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createItem } from "@/actions/items";
import { isFileItemType, type FileItemType } from "@/lib/file-constraints";
import {
  buildItemInput,
  getCreateFields,
  type CreatableItemType,
  type ItemFormValues,
} from "@/lib/item-content";
import { uploadFile } from "@/lib/upload-file";
import { fieldErrorsOf } from "@/lib/validations/field-errors";
import { updateItemSchema } from "@/lib/validations/items";
import type { FieldErrors } from "@/types/forms";

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

// The New Item dialog's create sequence: checks the other fields, uploads the
// file (if any) with progress, creates the item and reports the result
export function useCreateItem(onCreated: () => void) {
  const router = useRouter();
  const [progress, setProgress] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function create(type: CreatableItemType, values: ItemFormValues, file: File | null) {
    const input = buildItemInput(values, getCreateFields(type));
    let fileKey: string | undefined;
    if (isFileItemType(type) && file) {
      // Check the other fields first, so a rejected form doesn't upload for nothing
      const check = updateItemSchema.safeParse(input);
      if (!check.success) {
        setFieldErrors(fieldErrorsOf(check.error));
        toast.error("Please fix the highlighted fields.");
        return;
      }
      const key = await uploadChosenFile(type, file, setProgress, setFieldErrors);
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

  async function submit(type: CreatableItemType, values: ItemFormValues, file: File | null) {
    try {
      await create(type, values, file);
    } catch {
      setProgress(null);
      toast.error("Couldn't create the item. Please try again.");
    }
  }

  // Files and images have different rules, so a file error doesn't outlive its file
  function clearFileError() {
    setFieldErrors(withoutFileError);
  }

  return { progress, fieldErrors, submit, clearFileError };
}
