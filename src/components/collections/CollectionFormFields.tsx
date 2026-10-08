import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FieldErrors } from "@/types/forms";

// aria props that tie a control to its error message
function errorProps(id: string, error: string | undefined) {
  return error ? { "aria-invalid": true, "aria-describedby": `${id}-error` } : {};
}

function FieldError({ id, error }: { id: string; error: string | undefined }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="text-sm text-destructive">
      {error}
    </p>
  );
}

interface CollectionFormFieldsProps {
  // Prefix for the input ids, unique per form
  idPrefix: string;
  name: string;
  description: string;
  fieldErrors: FieldErrors;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
}

// Name and description inputs shared by the create and edit dialogs
export function CollectionFormFields({
  idPrefix,
  name,
  description,
  fieldErrors,
  onNameChange,
  onDescriptionChange,
}: CollectionFormFieldsProps) {
  const nameId = `${idPrefix}-name`;
  const descriptionId = `${idPrefix}-description`;
  const nameError = fieldErrors.name?.[0];
  const descriptionError = fieldErrors.description?.[0];

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={nameId}>Name</Label>
        <Input
          id={nameId}
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="e.g. React Patterns"
          required
          {...errorProps(nameId, nameError)}
        />
        <FieldError id={nameId} error={nameError} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={descriptionId}>Description</Label>
        <Textarea
          id={descriptionId}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="What's this collection for?"
          rows={3}
          {...errorProps(descriptionId, descriptionError)}
        />
        <FieldError id={descriptionId} error={descriptionError} />
      </div>
    </>
  );
}
