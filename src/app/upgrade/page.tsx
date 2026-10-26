import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { UpgradePlans } from "@/components/upgrade/UpgradePlans";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Upgrade · DevStash",
};

export default async function UpgradePage() {
  // The proxy only checks the JWT signature; a revoked session gets here without a user
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?callbackUrl=/upgrade");
  // Pro users manage their plan from settings
  if (user.isPro) redirect("/settings#billing");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 py-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-balance">Upgrade to DevStash Pro</h1>
        <p className="mt-2 text-pretty text-muted-foreground">
          Unlimited items and collections, file and image uploads, AI features and more.
        </p>
      </div>
      <UpgradePlans />
    </div>
  );
}
