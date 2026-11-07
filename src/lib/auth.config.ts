import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { nextUrl } = request;
      const pathname = nextUrl.pathname;

      const isProtected =
        pathname.startsWith("/dashboard") || pathname.startsWith("/links");
      const isAuthPage =
        pathname.startsWith("/login") || pathname.startsWith("/register");

      // Extract accurate origin from request headers (x-forwarded-host) for reverse proxies like Vercel
      const host =
        request.headers?.get?.("x-forwarded-host") ||
        request.headers?.get?.("host") ||
        nextUrl.host;
      const proto =
        request.headers?.get?.("x-forwarded-proto") ||
        (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
      const origin = `${proto}://${host}`;

      if (isProtected) {
        if (isLoggedIn) return true;
        // Redirect to login with callbackUrl
        const callbackUrl = encodeURIComponent(pathname);
        return Response.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, origin));
      }

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", origin));
      }

      // Public routes: /, /[code], /api/auth/*
      return true;
    },
    async redirect({ url, baseUrl }) {
      // 1. Allow relative URLs
      if (url.startsWith("/")) {
        return url;
      }

      try {
        const parsed = new URL(url);
        // 2. Allow same origin
        if (parsed.origin === baseUrl) {
          return url;
        }
        // 3. If redirect target is localhost on production/Vercel, sanitize to relative path
        if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
          return parsed.pathname + parsed.search;
        }
        // 4. Allow trusted production & preview domains
        if (
          parsed.hostname.endsWith(".vercel.app") ||
          parsed.hostname === "linkpulse-nine-nu.vercel.app"
        ) {
          return url;
        }
      } catch {
        // Fall back to relative /dashboard
      }

      return "/dashboard";
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) ?? (token.sub as string);
        session.user.email = token.email as string;
        session.user.name = token.name as string | null | undefined;
      }
      return session;
    },
  },
  providers: [], // Overridden in auth.ts with Node-specific providers
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
