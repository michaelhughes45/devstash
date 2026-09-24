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
