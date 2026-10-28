/**
 * @module services
 *
 * Business logic service layer for LinkPulse.
 * Services contain pure, testable logic decoupled from HTTP.
 * Modules added here phase-by-phase:
 *
 * Phase 3 — links.service.ts      (createLink)
 * Phase 4 — redirect.service.ts   (resolveShortCode, checkLinkStatus)
 * Phase 5 — analytics.service.ts  (recordClick, getAnalytics)
 */

export * from "./links.service";
