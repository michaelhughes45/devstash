import {
  Code,
  FileIcon,
  ImageIcon,
  LinkIcon,
  Sparkles,
  StickyNote,
  Terminal,
  type LucideIcon,
} from "lucide-react";

// Used when a type has no icon or color set
export const DEFAULT_TYPE_ICON = "File";
export const DEFAULT_TYPE_COLOR = "#6b7280";

// Maps the Lucide icon names stored on item types to their components.
export const ITEM_TYPE_ICONS: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File: FileIcon,
  Image: ImageIcon,
  Link: LinkIcon,
};

export function getItemTypeIcon(name: string): LucideIcon {
  return ITEM_TYPE_ICONS[name] ?? FileIcon;
}
