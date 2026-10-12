"use client";

import { useOptimisticToggle } from "@/hooks/use-optimistic-toggle";
import type { ToggleFavoriteResult } from "@/types/favorites";

interface UseFavoriteToggleOptions {
  isFavorite: boolean;
  save: (isFavorite: boolean) => Promise<ToggleFavoriteResult>;
  // Called with the saved value, for state the refresh doesn't reach (the drawer)
  onSaved?: (isFavorite: boolean) => void;
}

const FAVORITE_MESSAGES = {
  on: "Added to favorites",
  off: "Removed from favorites",
  failed: "Couldn't update favorites. Please try again.",
};

export function useFavoriteToggle({ isFavorite, save, onSaved }: UseFavoriteToggleOptions) {
  const toggle = useOptimisticToggle({
    value: isFavorite,
    save: async (next) => {
      const result = await save(next);
      return result.success ? { success: true, value: result.data.isFavorite } : result;
    },
    messages: FAVORITE_MESSAGES,
    onSaved,
  });
  return { isFavorite: toggle.value, pending: toggle.pending, toggle: toggle.toggle };
}
