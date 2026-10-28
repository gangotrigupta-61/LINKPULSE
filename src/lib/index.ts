/**
 * @module lib
 *
 * Shared library utilities for LinkPulse.
 * Modules added here phase-by-phase:
 *
 * Phase 1 — prisma.ts         (Prisma client singleton)
 * Phase 2 — auth.ts           (NextAuth configuration)
 * Phase 3 — ratelimit.ts      (Upstash rate limiter)
 * Phase 3 — nanoid.ts         (Short code generator)
 * Phase 3 — reserved-words.ts (Blocked alias list)
 * Phase 5 — ua-parser.ts      (User-agent parsing helpers)
 */

export { prisma, default as defaultPrisma } from "./prisma";
export { auth, signIn, signOut, handlers } from "./auth";
export { generateShortCode } from "./nanoid";
export { isReservedWord, RESERVED_WORDS } from "./reserved-words";
export { checkLinkCreateRateLimit } from "./ratelimit";
