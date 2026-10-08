import Link from "next/link";

import { SidebarSection } from "@/components/dashboard/SidebarSection";
import { Badge } from "@/components/ui/badge";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { ItemTypeWithCount } from "@/lib/db/item-types";
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
                {type.isPro && (
                  <Badge
                    variant="outline"
                    className="h-4 px-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground group-data-[collapsible=icon]:hidden"
                  >
                    PRO
                  </Badge>
                )}
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
