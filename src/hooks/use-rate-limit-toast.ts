import { useEffect } from "react";
import { toast } from "sonner";

// Toasts the rate limit message from a server action's state; each submission returns a new state object
export function useRateLimitToast(state: { rateLimitError?: string }) {
  useEffect(() => {
    if (state.rateLimitError) toast.error(state.rateLimitError);
  }, [state]);
}
