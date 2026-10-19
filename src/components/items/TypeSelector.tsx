import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { Badge } from "@/components/ui/badge";
import type { CreatableItemType } from "@/lib/item-content";
import { isProOnlyItemType } from "@/lib/item-type-names";
import { cn } from "@/lib/utils";
import type { CreatableItemTypeOption } from "@/types/items";

interface TypeSelectorProps {
  types: CreatableItemTypeOption[];
  value: CreatableItemType;
  onChange: (type: CreatableItemType) => void;
  // Free users see a PRO badge on file and image
  isPro: boolean;
}

// Native radios styled as chips, so arrow keys move between types
export function TypeSelector({ types, value, onChange, isPro }: TypeSelectorProps) {
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
            {!isPro && isProOnlyItemType(type.name) && (
              <Badge
                variant="outline"
                className="h-4 px-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground"
              >
                PRO
              </Badge>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
