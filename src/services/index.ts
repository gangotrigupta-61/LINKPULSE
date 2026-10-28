/**
 * @module services
 *
 * Business logic service layer for LinkPulse.
 * Services contain pure, testable logic decoupled from HTTP.
 * Modules added here phase-by-phase:
 *
 * Phase 3 — links.service.ts            (createLink)
 * Phase 4 — redirect.service.ts         (resolveShortCode)
 * Phase 4 — link-management.service.ts  (getUserLinks, getLinkById, updateLink, deleteLink)
 * Phase 5 — analytics.service.ts        (recordClick, getLinkAnalytics)
 */

export * from "./links.service";
export * from "./redirect.service";
export * from "./link-management.service";
export * from "./analytics.service";

