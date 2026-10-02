import bcrypt from "bcryptjs";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { PASSWORD_RESET_PREFIX } from "@/lib/tokens";

export type ChangePasswordResult = "changed" | "wrong-password" | "no-password";

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, password: true },
  });
  if (!user?.password) return "no-password";

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) return "wrong-password";

  const passwordHash = await hashPassword(newPassword);
  // An outstanding reset link would otherwise still override the new password
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { password: passwordHash } }),
    prisma.verificationToken.deleteMany({
      where: { identifier: `${PASSWORD_RESET_PREFIX}${user.email}` },
    }),
  ]);
  return "changed";
}

export type DeleteAccountResult =
  | "deleted"
  | "not-found"
  | "wrong-password"
  | "wrong-confirmation";

// Password users confirm with their password; accounts without one (GitHub only)
// confirm by typing their email.
// Items, collections, tags, custom types and accounts go with the user via cascade
// deletes; tokens are keyed by email rather than user, so they're removed here
export async function deleteUserAccount(
  userId: string,
  confirmation: string,
): Promise<DeleteAccountResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, password: true },
  });
  if (!user) return "not-found";

  if (user.password) {
    const isValid = await bcrypt.compare(confirmation, user.password);
    if (!isValid) return "wrong-password";
  } else if (confirmation.trim().toLowerCase() !== user.email.toLowerCase()) {
    return "wrong-confirmation";
  }

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({
      where: {
        identifier: { in: [user.email, `${PASSWORD_RESET_PREFIX}${user.email}`] },
      },
    }),
    prisma.user.deleteMany({ where: { id: userId } }),
  ]);
  return "deleted";
}
