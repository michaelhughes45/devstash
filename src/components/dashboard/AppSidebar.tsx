import Link from "next/link";
import { Layers } from "lucide-react";

import { CollectionsNav } from "@/components/dashboard/CollectionsNav";
import { TypesNav } from "@/components/dashboard/TypesNav";
import { UserNav } from "@/components/dashboard/UserNav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { getSidebarCollections } from "@/lib/db/collections";
import { getItemTypesWithCounts } from "@/lib/db/item-types";
import { getSession } from "@/lib/session";

const SIDEBAR_RECENT_COLLECTIONS_LIMIT = 5;

export async function AppSidebar() {
  const session = await getSession();
  const userId = session?.user?.id;
  const [itemTypes, collections] = userId
    ? await Promise.all([
        getItemTypesWithCounts(userId),
        getSidebarCollections(userId, SIDEBAR_RECENT_COLLECTIONS_LIMIT),
      ])
    : [[], { favorites: [], recent: [] }];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-violet-600 text-white">
                <Layers />
              </div>
              <span className="text-lg font-semibold">DevStash</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <TypesNav itemTypes={itemTypes} />
        <SidebarSeparator className="mx-0" />
        <CollectionsNav collections={collections} />
      </SidebarContent>
      <SidebarFooter className="border-t">
        {session?.user && <UserNav user={session.user} />}
      </SidebarFooter>
    </Sidebar>
  );
}
