"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FREE_COLLECTION_LIMIT, FREE_ITEM_LIMIT } from "@/lib/plan-limits";
import type { BillingPlan } from "@/lib/validations/billing";

type BillingAction = BillingPlan | "portal";

interface BillingSettingsProps {
  isPro: boolean;
  hasBillingAccount: boolean;
  usage: { itemCount: number; collectionCount: number };
  // Back from Checkout before the webhook has made the user Pro
  finishingUpgrade: boolean;
}

interface BillingResponse {
  success: boolean;
  data?: { url: string };
  error?: string;
}

const GENERIC_ERROR = "Something went wrong. Please try again.";

// Both routes answer with a Stripe-hosted URL to send the user to
async function requestBillingUrl(action: BillingAction): Promise<string> {
  const response =
    action === "portal"
      ? await fetch("/api/stripe/portal", { method: "POST" })
      : await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: action }),
        });
  const body = (await response.json().catch(() => null)) as BillingResponse | null;
  if (!response.ok || !body?.data?.url) throw new Error(body?.error ?? GENERIC_ERROR);
  return body.data.url;
}

export function BillingSettings({
  isPro,
  hasBillingAccount,
  usage,
  finishingUpgrade,
}: BillingSettingsProps) {
  const [pending, setPending] = useState<BillingAction | null>(null);

  async function start(action: BillingAction) {
    setPending(action);
    try {
      // Stays pending while the browser leaves for Stripe
      window.location.assign(await requestBillingUrl(action));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : GENERIC_ERROR);
      setPending(null);
    }
  }

  function actionButton(
    action: BillingAction,
    label: string,
    variant: "default" | "outline",
  ) {
    return (
      <Button
        type="button"
        variant={variant}
        disabled={pending !== null}
        onClick={() => start(action)}
      >
        {pending === action && <Loader2 className="animate-spin" aria-hidden="true" />}
        {label}
      </Button>
    );
  }

  const showUpgrade = !isPro && !finishingUpgrade;

  return (
    <Card id="billing" className="scroll-mt-20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Billing</CardTitle>
          <Badge variant={isPro ? "default" : "secondary"}>{isPro ? "Pro" : "Free"}</Badge>
        </div>
        <CardDescription>
          {isPro
            ? "Unlimited items and collections, file and image uploads."
            : "Upgrade to Pro for unlimited items and collections, file and image uploads."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {finishingUpgrade && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Finishing your upgrade… Refresh the page if this doesn&apos;t update in a moment.
          </p>
        )}

        {!isPro && (
          <dl className="grid gap-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Items</dt>
              <dd>
                {usage.itemCount} / {FREE_ITEM_LIMIT}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Collections</dt>
              <dd>
                {usage.collectionCount} / {FREE_COLLECTION_LIMIT}
              </dd>
            </div>
          </dl>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {showUpgrade && actionButton("monthly", "Upgrade — $8/month", "default")}
          {showUpgrade && actionButton("yearly", "Upgrade — $72/year (save 25%)", "outline")}
          {(isPro || hasBillingAccount) && actionButton("portal", "Manage billing", "outline")}
        </div>
      </CardContent>
    </Card>
  );
}
