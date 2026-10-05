"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ItemDrawer, type ItemDrawerState } from "@/components/items/ItemDrawer";
import type { ItemDetailData, ItemPreview } from "@/types/items";

interface ItemDrawerContextValue {
  openItem: (preview: ItemPreview) => void;
}

interface ItemDetailResponse {
  success: boolean;
  data?: ItemDetailData;
  error?: string;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

export function useItemDrawer(): ItemDrawerContextValue {
  const context = useContext(ItemDrawerContext);
  if (!context) throw new Error("useItemDrawer must be used within ItemDrawerProvider");
  return context;
}

async function fetchItemDetail(id: string, signal: AbortSignal): Promise<ItemDetailData> {
  const response = await fetch(`/api/items/${encodeURIComponent(id)}`, { signal });
  const body = (await response.json().catch(() => null)) as ItemDetailResponse | null;
  if (!response.ok || !body?.success || !body.data) {
    throw new Error(body?.error ?? "Failed to load item");
  }
  return body.data;
}

interface ItemDrawerProviderProps {
  children: ReactNode;
}

// Owns the drawer so server-rendered item cards can open it by item id
export function ItemDrawerProvider({ children }: ItemDrawerProviderProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ItemDrawerState | null>(null);
  const [editing, setEditing] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  const openItem = useCallback(async (preview: ItemPreview) => {
    // A newer click wins over a request still in flight
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    setState({ status: "loading", preview });
    setEditing(false);
    setOpen(true);

    try {
      const item = await fetchItemDetail(preview.id, controller.signal);
      setState({ status: "loaded", preview, item });
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : "Failed to load item";
      setState({ status: "error", preview, error: message });
    }
  }, []);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) requestRef.current?.abort();
    setOpen(nextOpen);
  }, []);

  // The saved item replaces the loaded one, and its title updates the header
  const handleItemSaved = useCallback((item: ItemDetailData) => {
    setState((current) =>
      current?.preview.id === item.id
        ? {
            status: "loaded",
            preview: { ...current.preview, title: item.title },
            item,
          }
        : current,
    );
    setEditing(false);
  }, []);

  const value = useMemo(() => ({ openItem }), [openItem]);

  return (
    <ItemDrawerContext.Provider value={value}>
      {children}
      <ItemDrawer
        open={open}
        onOpenChange={handleOpenChange}
        state={state}
        editing={editing}
        onEditingChange={setEditing}
        onItemSaved={handleItemSaved}
      />
    </ItemDrawerContext.Provider>
  );
}
