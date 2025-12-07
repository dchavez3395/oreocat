import GitHubProvider from "next-auth/providers/github";
import type { NextAuthOptions } from "next-auth";

const githubId = process.env.GITHUB_ID;
const githubSecret = process.env.GITHUB_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!githubId || !githubSecret) {
  console.warn("Missing GITHUB_ID or GITHUB_SECRET for NextAuth GitHub provider.");
}

if (!nextAuthSecret) {
  console.warn("Missing NEXTAUTH_SECRET for NextAuth.");
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: githubId || "placeholder",
      clientSecret: githubSecret || "placeholder",
    }),
  ],
  secret: nextAuthSecret,
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};
