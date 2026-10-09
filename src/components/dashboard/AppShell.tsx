import type { ReactNode } from "react";

import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { ItemDrawerProvider } from "@/components/items/ItemDrawerProvider";
import { EditorPreferencesProvider } from "@/components/settings/EditorPreferencesContext";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCollectionOptions } from "@/lib/db/collections";
import { getSearchData } from "@/lib/db/search";
import { getEditorPreferences } from "@/lib/db/users";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/editor-preferences";
import { getCurrentUserId } from "@/lib/session";
import type { SearchData } from "@/types/search";

interface AppShellProps {
  children: ReactNode;
}

const EMPTY_SEARCH_DATA: SearchData = { items: [], collections: [] };

// Sidebar and top bar shared by the signed-in pages
export async function AppShell({ children }: AppShellProps) {
  const userId = await getCurrentUserId();
  const [collections, searchData, editorPreferences] = userId
    ? await Promise.all([
        // Offered by both the New Item dialog and the drawer's edit form
        getCollectionOptions(userId),
        // Searched in the browser by the command palette
        getSearchData(userId),
        // Used by every code editor and the settings page
        getEditorPreferences(userId),
      ])
    : [[], EMPTY_SEARCH_DATA, DEFAULT_EDITOR_PREFERENCES];

  return (
    <TooltipProvider>
      <EditorPreferencesProvider initialPreferences={editorPreferences}>
        <SidebarProvider className="h-dvh">
          <AppSidebar />
          <SidebarInset className="min-w-0 overflow-hidden">
            {/* Wraps the top bar too, so search results can open the drawer */}
            <ItemDrawerProvider collections={collections}>
              <TopBar collections={collections} searchData={searchData} />
              <div className="flex-1 overflow-y-auto p-6">{children}</div>
            </ItemDrawerProvider>
          </SidebarInset>
        </SidebarProvider>
      </EditorPreferencesProvider>
    </TooltipProvider>
  );
}
