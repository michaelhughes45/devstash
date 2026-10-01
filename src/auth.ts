import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { EMAIL_NOT_VERIFIED_CODE } from "@/lib/auth-errors";
import { sendVerificationEmail } from "@/lib/email-verification";
import { signInSchema } from "@/lib/validations/auth";
import authConfig from "@/auth.config";

class EmailNotVerifiedError extends CredentialsSignin {
  code = EMAIL_NOT_VERIFIED_CODE;
}

// Replaces the edge placeholder with bcrypt validation against the database
const credentials = Credentials({
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(input, request) {
    const parsed = signInSchema.safeParse(input);
    if (!parsed.success) return null;

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    // OAuth-only users have no password and can't sign in with credentials
    if (!user?.password) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    // Checked after the password so unverified status isn't revealed to guessers
    if (!user.emailVerified) {
      // Send a fresh link so users with an expired or lost email aren't stuck
      try {
        await sendVerificationEmail(user.email, new URL(request.url).origin);
      } catch (error) {
        console.error("Failed to resend verification email", error);
      }
      throw new EmailNotVerifiedError();
    }

    return { id: user.id, name: user.name, email: user.email, image: user.image };
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  providers: authConfig.providers.map((provider) =>
    typeof provider !== "function" && provider.id === "credentials"
      ? credentials
      : provider,
  ),
});
