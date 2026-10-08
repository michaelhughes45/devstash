"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { copyLoadedText, copyToClipboard } from "@/lib/clipboard";
import { fetchItemDetail } from "@/lib/fetch-item";
import { getItemCopyText, type CardCopySource } from "@/lib/item-content";
import { cn } from "@/lib/utils";

interface CopyItemButtonProps {
  itemId: string;
  source: CardCopySource;
  title: string;
  className?: string;
}

// Quick copy icon for item cards; rendered beside the drawer trigger, never inside it.
// Text items fetch their content on click, since cards don't load it.
export function CopyItemButton({ itemId, source, title, className }: CopyItemButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (source.kind === "text") {
      await copyToClipboard(source.text);
      return;
    }
    setPending(true);
    try {
      await copyLoadedText(async () => getItemCopyText(await fetchItemDetail(itemId)) ?? "");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={handleClick}
      disabled={pending}
      aria-label={`Copy ${title}`}
      title="Copy"
      className={cn("text-muted-foreground hover:text-foreground", className)}
    >
      <Copy />
    </Button>
  );
}
