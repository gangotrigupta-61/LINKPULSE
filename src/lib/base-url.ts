/**
 * Centralized base application URL resolver.
 * Handles production custom domains, Vercel system deployment URLs, and local development.
 */
export function getBaseUrl(request?: Request | Headers): string {
  // 1. Client-side browser: always use the current window origin
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  // 2. If a server Request or Headers object is provided, inspect forwarded headers
  if (request) {
    const headers = "headers" in request ? request.headers : request;
    const forwardedHost = headers.get("x-forwarded-host") || headers.get("host");
    if (forwardedHost) {
      const forwardedProto =
        headers.get("x-forwarded-proto") ||
        (forwardedHost.includes("localhost") || forwardedHost.includes("127.0.0.1")
          ? "http"
          : "https");
      return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, "");
    }
  }

  const isVercel = Boolean(
    process.env.VERCEL ||
    process.env.VERCEL_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  );
  const isProduction = process.env.NODE_ENV === "production" || isVercel;

  // 3. Explicit public app URL (only use if not a localhost URL in production)
  const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (publicAppUrl && (!isProduction || !isLocalhost(publicAppUrl))) {
    return publicAppUrl;
  }

  // 4. Vercel production custom domain (set by Vercel deployment)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim().replace(/\/+$/, "")}`;
  }

  // 5. Vercel preview / deployment URL (set by Vercel system)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/+$/, "")}`;
  }

  // 6. NextAuth canonical URL (only use if not a localhost URL in production)
  const nextAuthUrl = process.env.NEXTAUTH_URL?.trim().replace(/\/+$/, "");
  if (nextAuthUrl && (!isProduction || !isLocalhost(nextAuthUrl))) {
    return nextAuthUrl;
  }

  // 7. Known production deployment fallback
  if (isProduction) {
    return "https://linkpulse-nine-nu.vercel.app";
  }

  // 8. Local development fallback
  return "http://localhost:3000";
}

function isLocalhost(url: string): boolean {
  return url.includes("localhost") || url.includes("127.0.0.1") || url.includes("0.0.0.0");
}
