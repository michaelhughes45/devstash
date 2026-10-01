import type { ComponentProps } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: ComponentProps<typeof Avatar>["size"];
  className?: string;
}

// "Brad Traversy" → "BT"; falls back to the email's first letter, then "?"
function getInitials(name?: string | null, email?: string | null): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length > 0) {
    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return `${first}${last}`.toUpperCase();
  }
  return email?.[0]?.toUpperCase() ?? "?";
}

export function UserAvatar({ name, email, image, size, className }: UserAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      {image && <AvatarImage src={image} alt={name ?? "User avatar"} />}
      <AvatarFallback>{getInitials(name, email)}</AvatarFallback>
    </Avatar>
  );
}
