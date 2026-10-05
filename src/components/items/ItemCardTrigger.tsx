"use client";

import type { ReactNode } from "react";

import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import type { ItemPreview } from "@/types/items";

interface ItemCardTriggerProps {
  preview: ItemPreview;
  children: ReactNode;
}

// Makes a server-rendered item card open the item drawer
export function ItemCardTrigger({ preview, children }: ItemCardTriggerProps) {
  const { openItem } = useItemDrawer();

  return (
    <button
      type="button"
      onClick={() => openItem(preview)}
      aria-haspopup="dialog"
      className="block w-full cursor-pointer rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {children}
    </button>
  );
}
