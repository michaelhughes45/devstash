import type { ReactNode } from "react";

import { CodeEditor } from "@/components/items/CodeEditor";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EditableFields, ItemFormValues } from "@/lib/item-content";
import type { FieldErrors } from "@/types/forms";

interface FormFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

function FormField({ id, label, hint, error, children }: FormFieldProps) {
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

// aria props that tie a control to its FormField error message
function errorProps(id: string, error: string | undefined) {
  return error
    ? { "aria-invalid": true, "aria-describedby": `${id}-error` }
    : {};
}

interface ItemFormFieldsProps {
  // Prefixes the input ids, so two forms on a page don't clash
  idPrefix: string;
  values: ItemFormValues;
  onChange: (field: keyof ItemFormValues, value: string) => void;
  fields: EditableFields;
  fieldErrors: FieldErrors;
}

// Title, description, type-specific fields and tags, shared by the edit and create forms
export function ItemFormFields({
  idPrefix,
  values,
  onChange,
  fields,
  fieldErrors,
}: ItemFormFieldsProps) {
  const id = (field: string) => `${idPrefix}-${field}`;
  const error = (field: string) => fieldErrors[field]?.[0];

  return (
    <>
      <FormField id={id("title")} label="Title" error={error("title")}>
        <Input
          id={id("title")}
          value={values.title}
          onChange={(event) => onChange("title", event.target.value)}
          required
          {...errorProps(id("title"), error("title"))}
        />
      </FormField>

      <FormField id={id("description")} label="Description" error={error("description")}>
        <Textarea
          id={id("description")}
          value={values.description}
          onChange={(event) => onChange("description", event.target.value)}
          rows={3}
          {...errorProps(id("description"), error("description"))}
        />
      </FormField>

      {fields.content && fields.language && (
        <FormField id={id("content")} label="Content" error={error("content")}>
          <CodeEditor
            value={values.content}
            language={values.language}
            onChange={(value) => onChange("content", value)}
            ariaLabel="Content"
            invalid={Boolean(error("content"))}
          />
        </FormField>
      )}

      {fields.content && fields.markdown && (
        <FormField id={id("content")} label="Content" error={error("content")}>
          <MarkdownEditor
            id={id("content")}
            value={values.content}
            onChange={(value) => onChange("content", value)}
            ariaLabel="Content"
            ariaDescribedBy={error("content") && `${id("content")}-error`}
            invalid={Boolean(error("content"))}
          />
        </FormField>
      )}

      {fields.content && !fields.language && !fields.markdown && (
        <FormField id={id("content")} label="Content" error={error("content")}>
          <Textarea
            id={id("content")}
            value={values.content}
            onChange={(event) => onChange("content", event.target.value)}
            rows={10}
            spellCheck={false}
            className="max-h-[28rem] font-mono text-xs leading-relaxed md:text-xs"
            {...errorProps(id("content"), error("content"))}
          />
        </FormField>
      )}

      {fields.language && (
        <FormField id={id("language")} label="Language" error={error("language")}>
          <Input
            id={id("language")}
            value={values.language}
            onChange={(event) => onChange("language", event.target.value)}
            placeholder="e.g. typescript"
            {...errorProps(id("language"), error("language"))}
          />
        </FormField>
      )}

      {fields.url && (
        <FormField id={id("url")} label="URL" error={error("url")}>
          <Input
            id={id("url")}
            type="url"
            value={values.url}
            onChange={(event) => onChange("url", event.target.value)}
            placeholder="https://"
            {...errorProps(id("url"), error("url"))}
          />
        </FormField>
      )}

      <FormField
        id={id("tags")}
        label="Tags"
        hint="Separate tags with commas"
        error={error("tags")}
      >
        <Input
          id={id("tags")}
          value={values.tags}
          onChange={(event) => onChange("tags", event.target.value)}
          placeholder="react, hooks"
          {...errorProps(id("tags"), error("tags"))}
        />
      </FormField>
    </>
  );
}
