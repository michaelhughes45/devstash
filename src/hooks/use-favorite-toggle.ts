"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ToggleFavoriteResult } from "@/types/favorites";

interface UseFavoriteToggleOptions {
  isFavorite: boolean;
  save: (isFavorite: boolean) => Promise<ToggleFavoriteResult>;
  // Called with the saved value, for state the refresh doesn't reach (the drawer)
  onSaved?: (isFavorite: boolean) => void;
}

// Flips the star straight away; the optimistic value holds until the save and
// the refresh finish, and falls back to the stored one if the save fails
export function useFavoriteToggle({ isFavorite, save, onSaved }: UseFavoriteToggleOptions) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(isFavorite);

  function toggle() {
    const next = !optimistic;
    startTransition(async () => {
      setOptimistic(next);
      try {
        const result = await save(next);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        onSaved?.(result.data.isFavorite);
        toast.success(result.data.isFavorite ? "Added to favorites" : "Removed from favorites");
        router.refresh();
      } catch {
        toast.error("Couldn't update favorites. Please try again.");
      }
    });
  }

  return { isFavorite: optimistic, pending, toggle };
}
