"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type ToggleSaveResult =
  | { success: true; value: boolean }
  | { success: false; error: string };

export interface ToggleMessages {
  on: string;
  off: string;
  failed: string;
}

interface UseOptimisticToggleOptions {
  value: boolean;
  save: (value: boolean) => Promise<ToggleSaveResult>;
  messages: ToggleMessages;
  // Called with the saved value, for state the refresh doesn't reach (the drawer)
  onSaved?: (value: boolean) => void;
}

// Flips the flag straight away; the optimistic value holds until the save and
// the refresh finish, and falls back to the stored one if the save fails
export function useOptimisticToggle({ value, save, messages, onSaved }: UseOptimisticToggleOptions) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(value);

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
        onSaved?.(result.value);
        toast.success(result.value ? messages.on : messages.off);
        router.refresh();
      } catch {
        toast.error(messages.failed);
      }
    });
  }

  return { value: optimistic, pending, toggle };
}
