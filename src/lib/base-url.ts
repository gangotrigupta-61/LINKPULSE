/**
 * Centralized base application URL resolver.
 * Handles production custom domains, Vercel system deployment URLs, and local development.
 */
export function getBaseUrl(): string {
  // 1. Explicit public app URL (client & server)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }

  // 2. NextAuth canonical URL
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/+$/, "");
  }

  // 3. Vercel production custom domain (set by Vercel deployment)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/+$/, "")}`;
  }

  // 4. Vercel preview / deployment URL (set by Vercel system)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}`;
  }

  // 5. Localhost fallback
  return "http://localhost:3000";
}

