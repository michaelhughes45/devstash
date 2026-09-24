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

export function AppSidebar() {
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
        <TypesNav />
        <SidebarSeparator className="mx-0" />
        <CollectionsNav />
      </SidebarContent>
      <SidebarFooter className="border-t">
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  );
}
