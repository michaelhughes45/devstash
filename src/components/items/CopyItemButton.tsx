"use client";

import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

interface CopyItemButtonProps {
  text: string;
  title: string;
  className?: string;
}

// Quick copy icon for item cards; rendered beside the drawer trigger, never inside it
export function CopyItemButton({ text, title, className }: CopyItemButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={() => copyToClipboard(text)}
      aria-label={`Copy ${title}`}
      title="Copy"
      className={cn("text-muted-foreground hover:text-foreground", className)}
    >
      <Copy />
    </Button>
  );
}
