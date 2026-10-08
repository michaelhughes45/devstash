import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import type { CreatableItemType } from "@/lib/item-content";
import { cn } from "@/lib/utils";
import type { CreatableItemTypeOption } from "@/types/items";

interface TypeSelectorProps {
  types: CreatableItemTypeOption[];
  value: CreatableItemType;
  onChange: (type: CreatableItemType) => void;
}

// Native radios styled as chips, so arrow keys move between types
export function TypeSelector({ types, value, onChange }: TypeSelectorProps) {
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
