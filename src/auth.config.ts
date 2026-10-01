import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

// Edge-compatible config shared with the proxy: no adapter or database access
export default {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  providers: [
    GitHub,
    // Placeholder so the provider is known at the edge; auth.ts supplies the real authorize
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: () => null,
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
