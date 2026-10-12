"use client";

import { useOptimisticToggle } from "@/hooks/use-optimistic-toggle";
import type { TogglePinResult } from "@/types/items";

interface UsePinToggleOptions {
  isPinned: boolean;
  save: (isPinned: boolean) => Promise<TogglePinResult>;
  // Called with the saved value, for state the refresh doesn't reach (the drawer)
  onSaved?: (isPinned: boolean) => void;
}

const PIN_MESSAGES = {
  on: "Item pinned",
  off: "Item unpinned",
  failed: "Couldn't update the pin. Please try again.",
};

export function usePinToggle({ isPinned, save, onSaved }: UsePinToggleOptions) {
  const toggle = useOptimisticToggle({
    value: isPinned,
    save: async (next) => {
      const result = await save(next);
      return result.success ? { success: true, value: result.data.isPinned } : result;
    },
    messages: PIN_MESSAGES,
    onSaved,
  });
  return { isPinned: toggle.value, pending: toggle.pending, toggle: toggle.toggle };
}
