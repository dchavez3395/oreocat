import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

const googleId = process.env.GOOGLE_ID;
const googleSecret = process.env.GOOGLE_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!googleId || !googleSecret) {
  console.warn("Missing GOOGLE_ID or GOOGLE_SECRET for NextAuth Google provider.");
}

if (!nextAuthSecret) {
  console.warn("Missing NEXTAUTH_SECRET for NextAuth.");
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleId || "placeholder",
      clientSecret: googleSecret || "placeholder",
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
