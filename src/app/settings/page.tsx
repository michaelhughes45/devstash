import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUserProfile } from "@/lib/db/users";
import { getCurrentUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Settings · DevStash",
};

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/sign-in?callbackUrl=/settings");

  const profile = await getUserProfile(userId);
  // The session can outlive the user (e.g. deleted elsewhere)
  if (!profile) redirect("/sign-in");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account</p>
      </div>

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
