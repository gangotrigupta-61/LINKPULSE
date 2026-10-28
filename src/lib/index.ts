/**
 * @module lib
 *
 * Shared library utilities for LinkPulse.
 * Modules added here phase-by-phase:
 *
 * Phase 1 — prisma.ts      (Prisma client singleton)
 * Phase 2 — auth.ts        (NextAuth configuration)
 * Phase 3 — ratelimit.ts   (Upstash rate limiter)
 * Phase 3 — nanoid.ts      (Short code generator)
 * Phase 5 — ua-parser.ts   (User-agent parsing helpers)
 * Phase 3 — reserved.ts    (Blocked alias list)
 */

export { prisma, default as defaultPrisma } from "./prisma";
