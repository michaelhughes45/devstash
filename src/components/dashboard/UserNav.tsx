import { Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { currentUser } from "@/lib/mock-data";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserNav() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" tooltip={currentUser.name}>
          <Avatar>
            {currentUser.image && (
              <AvatarImage src={currentUser.image} alt={currentUser.name} />
            )}
            <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate font-medium">{currentUser.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {currentUser.email}
            </span>
          </div>
          <Settings className="ml-auto text-muted-foreground" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
