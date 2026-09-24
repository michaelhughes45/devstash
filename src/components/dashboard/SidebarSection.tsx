import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

export function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <Collapsible defaultOpen>
      <SidebarGroup>
        <SidebarGroupLabel
          render={<CollapsibleTrigger />}
          className="group/label w-fit gap-1 text-sm hover:text-sidebar-foreground"
        >
          {title}
          <ChevronDown className="-rotate-90 transition-transform group-data-panel-open/label:rotate-0" />
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>{children}</SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
