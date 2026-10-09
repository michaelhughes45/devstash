import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Folder, Layers } from "lucide-react";

import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserAvatar } from "@/components/user/UserAvatar";
import { getCollectionStats } from "@/lib/db/collections";
import { getItemTypesWithCounts } from "@/lib/db/item-types";
import { getItemStats } from "@/lib/db/items";
import { getUserProfile } from "@/lib/db/users";
import { formatLongDate } from "@/lib/format-date";
import { getCurrentUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Profile · DevStash",
};

export default async function ProfilePage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/sign-in?callbackUrl=/profile");

  const [profile, itemStats, collectionStats, itemTypes] = await Promise.all([
    getUserProfile(userId),
    getItemStats(userId),
    getCollectionStats(userId),
    getItemTypesWithCounts(userId),
  ]);
  // The session can outlive the user (e.g. deleted elsewhere)
  if (!profile) redirect("/sign-in");

  const totals = [
    { label: "Items", value: itemStats.total, icon: Layers },
    { label: "Collections", value: collectionStats.total, icon: Folder },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Your account details and usage</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4">
          <UserAvatar
            name={profile.name}
            email={profile.email}
            image={profile.image}
            className="size-16 **:data-[slot=avatar-fallback]:text-xl"
          />
          <div className="grid min-w-0 gap-0.5">
            <p className="truncate text-lg font-semibold">{profile.name ?? "No name set"}</p>
            <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
            <p className="text-sm text-muted-foreground">
              Joined {formatLongDate(profile.createdAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>What you&apos;ve stored in DevStash</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            {totals.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-2 rounded-lg border p-4"
              >
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-semibold">{value}</p>
                </div>
                <Icon className="size-5 shrink-0 text-muted-foreground" />
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Items by type</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {itemTypes.map((type) => (
                <li
                  key={type.id}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <ItemTypeIcon icon={type.icon} className="size-4" style={{ color: type.color }} />
                  <span>{type.name}</span>
                  <span className="ml-auto font-medium tabular-nums">{type.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
