"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

// How long to give the webhook before re-checking once
const REFRESH_DELAY_MS = 2000;

interface UpgradeToastProps {
  // The page was reached from Checkout's success URL (?upgraded=1)
  upgraded: boolean;
  isPro: boolean;
}

// Welcomes a new Pro user back from Checkout and cleans the URL. If the webhook
// hasn't landed yet, the page re-renders once after a short wait (no polling)
export function UpgradeToast({ upgraded, isPro }: UpgradeToastProps) {
  const router = useRouter();
  const welcomed = useRef(false);
  const refreshed = useRef(false);

  useEffect(() => {
    if (!upgraded) return;

    if (isPro) {
      // Guards against Strict Mode running the effect twice
      if (welcomed.current) return;
      welcomed.current = true;
      toast.success("Welcome to DevStash Pro!");
      router.replace("/settings");
      return;
    }

    if (refreshed.current) return;
    // Marked inside the timer, so Strict Mode's cleanup doesn't cancel the only refresh
    const timer = setTimeout(() => {
      refreshed.current = true;
      router.refresh();
    }, REFRESH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [upgraded, isPro, router]);

  return null;
}
