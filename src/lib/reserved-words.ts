/**
 * Reserved words blocklist for short link aliases.
 * These slugs conflict with existing application routes or system assets.
 */
export const RESERVED_WORDS = new Set([
  // Core application routes
  "api",
  "dashboard",
  "login",
  "register",
  "logout",
  "auth",
  "links",
  "settings",
  "analytics",
  "qr",
  "admin",
  "health",

  // Static / Next.js assets
  "static",
  "_next",
  "favicon",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "manifest.json",
  "public",

  // Link status pages
  "expired",
  "disabled",
  "not-found",
  "404",
  "500",

  // Marketing & documentation
  "about",
  "terms",
  "privacy",
  "docs",
]);

/**
 * Check if a given alias is in the reserved words blocklist (case-insensitive).
 */
export function isReservedWord(alias: string): boolean {
  return RESERVED_WORDS.has(alias.toLowerCase().trim());
}
