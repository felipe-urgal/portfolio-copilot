import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

import { createCanonicalIdentitySubject } from "@/lib/identity";
import { isGitHubSignInAllowed } from "@/lib/production-auth";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  callbacks: {
    signIn({ account }) {
      return isGitHubSignInAllowed({
        nodeEnv: process.env.NODE_ENV,
        allowedAccountId: process.env.AUTH_GITHUB_ALLOWED_ACCOUNT_ID,
        provider: account?.provider,
        providerAccountId: account?.providerAccountId,
      });
    },
    jwt({ token, account }) {
      if (account != null) {
        const subject = createCanonicalIdentitySubject(account.provider, account.providerAccountId);
        if (subject !== null) token.sub = subject;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user === undefined || typeof token.sub !== "string" || token.sub.length === 0) {
        return session;
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        },
      };
    },
  },
});
