"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { updateItem } from "@/actions/items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getEditableFields, parseTags } from "@/lib/item-content";
import type { UpdateItemInput } from "@/lib/validations/items";
import type { ItemDetailData } from "@/types/items";

type FieldErrors = Record<string, string[] | undefined>;

interface EditFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

function EditField({ id, label, hint, error, children }: EditFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

// aria props that tie a control to its EditField error message
function errorProps(id: string, error: string | undefined) {
  return error
    ? { "aria-invalid": true, "aria-describedby": `${id}-error` }
    : {};
}

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
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [content, setContent] = useState(item.content ?? "");
  const [language, setLanguage] = useState(item.language ?? "");
  const [url, setUrl] = useState(item.url ?? "");
  const [tags, setTags] = useState(item.tags.join(", "));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  const error = (field: string) => fieldErrors[field]?.[0];

  function buildInput(): UpdateItemInput {
    return {
      title,
      description,
      tags: parseTags(tags),
      ...(fields.content && { content }),
      ...(fields.language && { language }),
      ...(fields.url && { url }),
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = await updateItem(item.id, buildInput());
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
        <Button type="submit" disabled={!title.trim() || isPending}>
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
          <EditField id="item-title" label="Title" error={error("title")}>
            <Input
              id="item-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              {...errorProps("item-title", error("title"))}
            />
          </EditField>

          <EditField id="item-description" label="Description" error={error("description")}>
            <Textarea
              id="item-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              {...errorProps("item-description", error("description"))}
            />
          </EditField>

          {fields.content && (
            <EditField id="item-content" label="Content" error={error("content")}>
              <Textarea
                id="item-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={10}
                spellCheck={false}
                className="max-h-[28rem] font-mono text-xs leading-relaxed md:text-xs"
                {...errorProps("item-content", error("content"))}
              />
            </EditField>
          )}

          {fields.language && (
            <EditField id="item-language" label="Language" error={error("language")}>
              <Input
                id="item-language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                placeholder="e.g. typescript"
                {...errorProps("item-language", error("language"))}
              />
            </EditField>
          )}

          {fields.url && (
            <EditField id="item-url" label="URL" error={error("url")}>
              <Input
                id="item-url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://"
                {...errorProps("item-url", error("url"))}
              />
            </EditField>
          )}

          <EditField
            id="item-tags"
            label="Tags"
            hint="Separate tags with commas"
            error={error("tags")}
          >
            <Input
              id="item-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="react, hooks"
              {...errorProps("item-tags", error("tags"))}
            />
          </EditField>
        </fieldset>

        {children}
      </div>
    </form>
  );
}
