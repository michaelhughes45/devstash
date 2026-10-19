import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BillingSettings } from "@/components/settings/BillingSettings";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";
import { EditorPreferencesForm } from "@/components/settings/EditorPreferencesForm";
import { UpgradeToast } from "@/components/settings/UpgradeToast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBillingStatus, getUserProfile } from "@/lib/db/users";
import { getCurrentUserId } from "@/lib/session";
import { getUserUsage } from "@/lib/usage-limits";

export const metadata: Metadata = {
  title: "Settings · DevStash",
};

interface SettingsPageProps {
  searchParams: Promise<{ upgraded?: string | string[] }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/sign-in?callbackUrl=/settings");

  // Read from the database rather than the session, so a webhook that just
  // landed shows straight away
  const [profile, billing, { upgraded }] = await Promise.all([
    getUserProfile(userId),
    getBillingStatus(userId),
    searchParams,
  ]);
  // The session can outlive the user (e.g. deleted elsewhere)
  if (!profile || !billing) redirect("/sign-in");

  const usage = await getUserUsage(userId, billing.isPro);
  const returnedFromCheckout = upgraded === "1";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your editor, billing and account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editor</CardTitle>
          <CardDescription>
            How the code editor looks and behaves for snippets and commands. Changes save
            automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditorPreferencesForm />
        </CardContent>
      </Card>

      <BillingSettings
        isPro={billing.isPro}
        hasBillingAccount={billing.hasBillingAccount}
        usage={usage}
        finishingUpgrade={returnedFromCheckout && !billing.isPro}
      />
      <UpgradeToast upgraded={returnedFromCheckout} isPro={billing.isPro} />

      {profile.hasPassword && (
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Enter your current password to choose a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      )}

      <Card className="ring-destructive/40">
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
          <CardDescription>
            Permanently delete your account and everything in it. This can&apos;t be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountDialog hasPassword={profile.hasPassword} />
        </CardContent>
      </Card>
    </div>
  );
}
