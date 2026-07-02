import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error("[auth] missing credentials");
            return null;
          }

          console.log("[auth] looking up user:", credentials.email);
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });
          console.log("[auth] user found:", !!user, "active:", user?.isActive);

          if (!user || !user.passwordHash || !user.isActive) return null;

          const valid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );
          console.log("[auth] password valid:", valid);
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
});

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
};
