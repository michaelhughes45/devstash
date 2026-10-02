import type { ReactNode } from "react";

import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

interface AppShellProps {
  children: ReactNode;
}

// Sidebar and top bar shared by the signed-in pages
export function AppShell({ children }: AppShellProps) {
  return (
    <TooltipProvider>
      <SidebarProvider className="h-dvh">
        <AppSidebar />
        <SidebarInset className="min-w-0 overflow-hidden">
          <TopBar />
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
