import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { EMAIL_NOT_VERIFIED_CODE, RATE_LIMITED_CODE } from "@/lib/auth-errors";
import {
  isEmailVerificationEnabled,
  sendVerificationEmail,
} from "@/lib/email-verification";
import { DUMMY_PASSWORD_HASH } from "@/lib/password";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { signInSchema } from "@/lib/validations/auth";
import authConfig from "@/auth.config";

export class EmailNotVerifiedError extends CredentialsSignin {
  code = EMAIL_NOT_VERIFIED_CODE;

  constructor(readonly linkSent: boolean) {
    super();
  }
}

export class SignInRateLimitedError extends CredentialsSignin {
  code = RATE_LIMITED_CODE;

  constructor(readonly reset: number) {
    super();
  }
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
    // Limited here rather than in the sign-in action so direct calls to the callback route count too
    const limit = await checkRateLimit("signIn", rateLimitKey(request.headers, email));
    if (!limit.success) throw new SignInRateLimitedError(limit.reset);

    const user = await prisma.user.findUnique({ where: { email } });
    // Always compare, so unknown and OAuth-only (no password) emails take as long as a wrong password
    const isValid = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH);
    if (!user?.password || !isValid) return null;
    // Checked after the password so unverified status isn't revealed to guessers
    if (isEmailVerificationEnabled() && !user.emailVerified) {
      // Send a fresh link so users with an expired or lost email aren't stuck
      const resend = await checkRateLimit(
        "resendVerification",
        rateLimitKey(request.headers, user.email),
      );
      if (resend.success) {
        try {
          await sendVerificationEmail(user.email);
        } catch (error) {
          console.error("Failed to resend verification email", error);
        }
      }
      throw new EmailNotVerifiedError(resend.success);
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
  callbacks: {
    ...authConfig.callbacks,
    // Not in auth.config.ts: the proxy has no database access, so it only checks the signature.
    // Returning null ends the session once the user is deleted or their sessionVersion is bumped
    async jwt({ token, user }) {
      const userId = user?.id ?? token.sub;
      if (!userId) return null;

      const current = await prisma.user.findUnique({
        where: { id: userId },
        select: { sessionVersion: true },
      });
      if (!current) return null;

      if (user) return { ...token, sessionVersion: current.sessionVersion };
      return token.sessionVersion === current.sessionVersion ? token : null;
    },
  },
});
