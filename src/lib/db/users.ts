import { prisma } from "@/lib/prisma";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  // Email/password users can change their password; OAuth-only users can't
  hasPassword: boolean;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      password: true,
    },
  });
  if (!user) return null;

  // The hash never leaves this function
  const { password, ...profile } = user;
  return { ...profile, hasPassword: password !== null };
}
