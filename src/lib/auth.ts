import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { loginSchema } from "@/validators/auth.validators";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const normalizedEmail = parsed.data.email.toLowerCase().trim();

        let user = null;
        try {
          user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });
        } catch {
          // If connection error / cold start, retry once after 1.5s
          console.warn("[Auth Login] Database cold start or connection issue, retrying lookup...");
          await new Promise((res) => setTimeout(res, 1500));
          try {
            user = await prisma.user.findUnique({
              where: { email: normalizedEmail },
            });
          } catch (retryErr) {
            console.error("[Auth Login] Database lookup failed after retry:", retryErr);
            return null;
          }
        }

        if (!user || !user.passwordHash) {
          // Prevent email enumeration by returning generic null
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
});
