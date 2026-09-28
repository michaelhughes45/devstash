import Link from "next/link";

import { SidebarSection } from "@/components/dashboard/SidebarSection";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { ItemTypeWithCount } from "@/lib/db/items";
import { getItemTypeIcon } from "@/lib/item-type-icons";

interface TypesNavProps {
  itemTypes: ItemTypeWithCount[];
}

export function TypesNav({ itemTypes }: TypesNavProps) {
  return (
    <SidebarSection title="Types">
      <SidebarMenu>
        {itemTypes.map((type) => {
          const Icon = getItemTypeIcon(type.icon);
          return (
            <SidebarMenuItem key={type.id}>
              <SidebarMenuButton
                tooltip={type.name}
                render={<Link href={`/items/${type.slug}`} />}
              >
                <Icon style={{ color: type.color }} />
                <span>{type.name}</span>
              </SidebarMenuButton>
              <SidebarMenuBadge className="text-muted-foreground">
                {type.count}
              </SidebarMenuBadge>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarSection>
  );
}
