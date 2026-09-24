import { createElement } from "react";
import type { LucideProps } from "lucide-react";

import { getItemTypeIcon } from "@/lib/item-type-icons";

interface ItemTypeIconProps extends LucideProps {
  icon: string;
}

// Icons are static module-level components, so looking one up by name is safe.
export function ItemTypeIcon({ icon, ...props }: ItemTypeIconProps) {
  return createElement(getItemTypeIcon(icon), props);
}
