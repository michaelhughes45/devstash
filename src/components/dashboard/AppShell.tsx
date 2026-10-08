import type { ReactNode } from "react";

import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { ItemDrawerProvider } from "@/components/items/ItemDrawerProvider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCollectionOptions } from "@/lib/db/collections";
import { getCurrentUserId } from "@/lib/session";

interface AppShellProps {
  children: ReactNode;
}

// Sidebar and top bar shared by the signed-in pages
export async function AppShell({ children }: AppShellProps) {
  // Offered by both the New Item dialog and the drawer's edit form
  const userId = await getCurrentUserId();
  const collections = userId ? await getCollectionOptions(userId) : [];

  return (
    <TooltipProvider>
      <SidebarProvider className="h-dvh">
        <AppSidebar />
        <SidebarInset className="min-w-0 overflow-hidden">
          <TopBar collections={collections} />
          <ItemDrawerProvider collections={collections}>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </ItemDrawerProvider>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
