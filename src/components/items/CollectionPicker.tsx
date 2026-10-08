import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CollectionOption } from "@/types/collections";

interface CollectionPickerProps {
  id: string;
  collections: CollectionOption[];
  value: string[];
  onChange: (collectionIds: string[]) => void;
  error?: string;
}

// Native checkboxes styled as chips, so Tab and Space pick any number of collections
export function CollectionPicker({ id, collections, value, onChange, error }: CollectionPickerProps) {
  const errorId = `${id}-error`;

  function toggle(collectionId: string, checked: boolean) {
    onChange(
      checked
        ? [...value, collectionId]
        : value.filter((selectedId) => selectedId !== collectionId),
    );
  }

  return (
    <fieldset className="grid gap-2" aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 text-sm leading-none font-medium">Collections</legend>
      {collections.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No collections yet. Create one with New Collection.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {collections.map((collection) => {
            const checked = value.includes(collection.id);
            return (
              <label
                key={collection.id}
                className={cn(
                  "relative flex max-w-full cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors hover:bg-muted has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                  checked && "border-foreground/40 bg-muted",
                )}
              >
                <input
                  type="checkbox"
                  name={id}
                  value={collection.id}
                  checked={checked}
                  onChange={(event) => toggle(collection.id, event.target.checked)}
                  className="sr-only"
                />
                {checked && <Check className="size-4 shrink-0" aria-hidden />}
                <span className="truncate">{collection.name}</span>
              </label>
            );
          })}
        </div>
      )}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
