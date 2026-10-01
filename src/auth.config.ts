import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

// Edge-compatible config shared with the proxy: no adapter or database access
export default {
  providers: [GitHub],
  callbacks: {
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
