import NextAuth from "next-auth";
import type { UserRole } from "@/generated/prisma";
import { credentialsProvider } from "@/lib/auth/credentials-provider";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [credentialsProvider],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.companyId = user.companyId;
        token.companyName = user.companyName;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string | undefined) ?? token.sub ?? "";
        session.user.email = (token.email as string | undefined) ?? session.user.email ?? "";
        session.user.name = (token.name as string | undefined) ?? session.user.name ?? "";
        session.user.role = token.role as UserRole;
        session.user.companyId = (token.companyId as string | null | undefined) ?? null;
        session.user.companyName = (token.companyName as string | null | undefined) ?? null;
      }
      return session;
    },
  },
});
