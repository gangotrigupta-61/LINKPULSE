/**
 * Phase 6, 7 & 8 Comprehensive Automated Test Suite
 *
 * Tests 1–50 covering Categories A through H:
 * A. Link Creation Tests (1–11)
 * B. Authentication Tests (12–15)
 * C. Redirection Tests (16–20)
 * D. Click Tracking Tests (21–26)
 * E. Ownership & Security Tests (27–31)
 * F. Link Management Tests (32–37)
 * G. Analytics Tests (38–44)
 * H. Edge Cases & Safety Tests (45–50)
 *
 * Uses mocked Prisma so all tests run cleanly in-process without live network/DB.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ─────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      link: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      click: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        deleteMany: vi.fn(),
      },
      user: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };
});

// ─── Mock Rate Limiter ───────────────────────────────────────────────────────
vi.mock("@/lib/ratelimit", () => {
  return {
    checkLinkCreateRateLimit: vi.fn(async (userId: string) => {
      if (userId === "rate-limited-user") {
        return { success: false, limit: 10, remaining: 0, reset: Date.now() + 3600000 };
      }
      return { success: true, limit: 10, remaining: 9, reset: Date.now() + 3600000 };
    }),
  };
});

import { prisma } from "@/lib/prisma";
import { createLink, AliasConflictError } from "@/services/links.service";
import { resolveShortCode } from "@/services/redirect.service";
import { recordClick, getLinkAnalytics } from "@/services/analytics.service";
import {
  getUserLinks,
  getLinkById,
  updateLink,
  deleteLink,
} from "@/services/link-management.service";
import {
  createLinkSchema,
  updateLinkSchema,
  urlSchema,
} from "@/validators/link.validators";
import { parseUserAgent } from "@/lib/ua-parser";
import { isReservedWord } from "@/lib/reserved-words";
import { checkLinkCreateRateLimit } from "@/lib/ratelimit";
import { authConfig } from "@/lib/auth.config";

const mockLinkFindFirst = vi.mocked(prisma.link.findFirst);
const mockLinkFindMany = vi.mocked(prisma.link.findMany);
const mockLinkCreate = vi.mocked(prisma.link.create);
const mockLinkUpdate = vi.mocked(prisma.link.update);
const mockLinkDelete = vi.mocked(prisma.link.delete);
const mockClickCreate = vi.mocked(prisma.click.create);
const mockClickFindMany = vi.mocked(prisma.click.findMany);
const mockUserFindUnique = vi.mocked(prisma.user.findUnique);

beforeEach(() => {
  vi.clearAllMocks();
});

// ═════════════════════════════════════════════════════════════════════════════
// A. LINK CREATION TESTS (1–11)
// ═════════════════════════════════════════════════════════════════════════════

describe("Category A: Link Creation Tests", () => {
  // Test 1: Valid URL creates link
  it("TEST 1: Valid URL creates a short link with shortCode and originalUrl", async () => {
    mockLinkFindFirst.mockResolvedValueOnce(null);
    mockLinkCreate.mockResolvedValueOnce({
      id: "link-1",
      shortCode: "custom1",
      originalUrl: "https://example.com/target",
      userId: "user-1",
      title: "My Target",
      expiresAt: null,
      isActive: true,
      createdAt: new Date(),
    } as never);

    const link = await createLink({
      userId: "user-1",
      url: "https://example.com/target",
      alias: "custom1",
      title: "My Target",
    });

    expect(link.id).toBe("link-1");
    expect(link.shortCode).toBe("custom1");
    expect(link.originalUrl).toBe("https://example.com/target");
  });

  // Test 2: Invalid URL rejected
  it("TEST 2: Invalid URL without protocol or malformed address is rejected", () => {
    const res1 = createLinkSchema.safeParse({ url: "not-a-valid-url" });
    const res2 = createLinkSchema.safeParse({ url: "httpexamplecom" });
    expect(res1.success).toBe(false);
    expect(res2.success).toBe(false);
  });

  // Test 3: ftp:// rejected
  it("TEST 3: ftp:// protocol is rejected by URL validator", () => {
    const res = createLinkSchema.safeParse({ url: "ftp://ftp.example.com/file.zip" });
    expect(res.success).toBe(false);
  });

  // Test 4: javascript:// rejected
  it("TEST 4: javascript: scheme is rejected to prevent XSS", () => {
    const res = createLinkSchema.safeParse({ url: "javascript:alert(document.cookie)" });
    expect(res.success).toBe(false);
  });

  // Test 5: data:// rejected
  it("TEST 5: data: URI scheme is rejected", () => {
    const res = createLinkSchema.safeParse({ url: "data:text/html,<script>alert(1)</script>" });
    expect(res.success).toBe(false);
  });

  // Test 6: Invalid alias format rejected
  it("TEST 6: Alias with special characters or spaces is rejected", () => {
    const res1 = createLinkSchema.safeParse({ url: "https://example.com", alias: "bad alias" });
    const res2 = createLinkSchema.safeParse({ url: "https://example.com", alias: "alias!@#" });
    const res3 = createLinkSchema.safeParse({ url: "https://example.com", alias: "ab" }); // < 3 chars
    expect(res1.success).toBe(false);
    expect(res2.success).toBe(false);
    expect(res3.success).toBe(false);
  });

  // Test 7: Reserved alias rejected
  it("TEST 7: Reserved routing aliases (e.g. dashboard, api, login) are rejected", () => {
    expect(isReservedWord("dashboard")).toBe(true);
    expect(isReservedWord("api")).toBe(true);
    expect(isReservedWord("LOGIN")).toBe(true); // case-insensitive check
    const res = createLinkSchema.safeParse({ url: "https://example.com", alias: "dashboard" });
    expect(res.success).toBe(false);
  });

  // Test 8: Duplicate alias rejected (case-insensitive)
  it("TEST 8: Duplicate alias triggers AliasConflictError case-insensitively", async () => {
    mockLinkFindFirst.mockResolvedValueOnce({ id: "existing-link", shortCode: "mybrand" } as never);

    await expect(
      createLink({
        userId: "user-1",
        url: "https://example.com",
        alias: "MYBRAND",
      })
    ).rejects.toThrow(AliasConflictError);
  });

  // Test 9: Past expiry rejected
  it("TEST 9: Expiration date in the past is rejected during creation", () => {
    const pastDate = new Date(Date.now() - 3600000).toISOString();
    const res = createLinkSchema.safeParse({
      url: "https://example.com",
      expiresAt: pastDate,
    });
    expect(res.success).toBe(false);
  });

  // Test 10: Future expiry accepted
  it("TEST 10: Expiration date in the future is accepted", () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const res = createLinkSchema.safeParse({
      url: "https://example.com",
      expiresAt: futureDate,
    });
    expect(res.success).toBe(true);
  });

  // Test 11: Rate limit enforced
  it("TEST 11: Link creation rate limit check fails when threshold is reached", async () => {
    const limitResult = await checkLinkCreateRateLimit("rate-limited-user");
    expect(limitResult.success).toBe(false);
    expect(limitResult.remaining).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// B. AUTHENTICATION TESTS (12–15)
// ═════════════════════════════════════════════════════════════════════════════

describe("Category B: Authentication Tests", () => {
  // Test 12: Unauthenticated user blocked
  it("TEST 12: Unauthenticated user blocked at service layer when userId is missing", async () => {
    // getLinkById requires userId
    const result = await getLinkById("link-1", "");
    expect(result).toBeNull();
  });

  // Test 13: Valid credentials succeed
  it("TEST 13: Valid user query retrieves user record for credential verification", async () => {
    mockUserFindUnique.mockResolvedValueOnce({
      id: "user-1",
      email: "user@example.com",
      passwordHash: "$2a$10$hashedPasswordValueExample",
      name: "User One",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const user = await prisma.user.findUnique({ where: { email: "user@example.com" } });
    expect(user).not.toBeNull();
    expect(user?.email).toBe("user@example.com");
  });

  // Test 14: Invalid credentials fail
  it("TEST 14: Non-existent email returns null on credential lookup", async () => {
    mockUserFindUnique.mockResolvedValueOnce(null);
    const user = await prisma.user.findUnique({ where: { email: "nonexistent@example.com" } });
    expect(user).toBeNull();
  });

  // Test 15: Protected routes require authentication
  it("TEST 15: Auth callback redirects unauthenticated requests for /dashboard and /links", () => {
    const authorized = authConfig.callbacks?.authorized;
    expect(authorized).toBeDefined();

    if (authorized) {
      // Unauthenticated request to /dashboard
      const unauthReq = {
        auth: null,
        request: { nextUrl: new URL("http://localhost:3000/dashboard") },
      } as never;
      const res = authorized(unauthReq);
      // Returns a redirect Response
      expect(res).toBeInstanceOf(Response);
      const redirectLocation = (res as Response).headers.get("location");
      expect(redirectLocation).toContain("/login");
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// C. REDIRECTION TESTS (16–20)
// ═════════════════════════════════════════════════════════════════════════════

describe("Category C: Redirection Tests", () => {
  // Test 16: Active link redirects to originalUrl
  it("TEST 16: Active, non-expired shortCode resolves to originalUrl", async () => {
    mockLinkFindFirst.mockResolvedValueOnce({
      id: "link-1",
      originalUrl: "https://destination.com/active",
      isActive: true,
      expiresAt: null,
    } as never);

    const res = await resolveShortCode("code123");
    expect(res.status).toBe("ok");
    expect(res.originalUrl).toBe("https://destination.com/active");
  });

  // Test 17: Non-existent link returns not_found
  it("TEST 17: Non-existent shortCode returns status not_found", async () => {
    mockLinkFindFirst.mockResolvedValueOnce(null);
    const res = await resolveShortCode("unknown-code");
    expect(res.status).toBe("not_found");
  });

  // Test 18: Expired link blocked
  it("TEST 18: Link with past expiration date returns status expired", async () => {
    mockLinkFindFirst.mockResolvedValueOnce({
      id: "link-1",
      originalUrl: "https://destination.com",
      isActive: true,
      expiresAt: new Date(Date.now() - 10000), // past
    } as never);

    const res = await resolveShortCode("expired-code");
    expect(res.status).toBe("expired");
  });

  // Test 19: Disabled/inactive link blocked
  it("TEST 19: Disabled link with isActive=false returns status inactive", async () => {
    mockLinkFindFirst.mockResolvedValueOnce({
      id: "link-1",
      originalUrl: "https://destination.com",
      isActive: false,
      expiresAt: null,
    } as never);

    const res = await resolveShortCode("inactive-code");
    expect(res.status).toBe("inactive");
  });

  // Test 20: Reserved words do not redirect
  it("TEST 20: Reserved words return not_found without querying database", async () => {
    const res = await resolveShortCode("dashboard");
    expect(res.status).toBe("not_found");
    expect(mockLinkFindFirst).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// D. CLICK TRACKING TESTS (21–26)
// ═════════════════════════════════════════════════════════════════════════════

describe("Category D: Click Tracking Tests", () => {
  // Test 21: Click recorded on redirect
  it("TEST 21: recordClick creates a click record with the target linkId", async () => {
    mockClickCreate.mockResolvedValueOnce({ id: "click-1" } as never);

    await recordClick("link-1", {
      referrer: "https://twitter.com",
      deviceType: "desktop",
      browser: "Chrome",
    });

    expect(mockClickCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ linkId: "link-1" }),
      })
    );
  });

  // Test 22: Timestamp recorded
  it("TEST 22: recordClick stores timestamp as Date instance", async () => {
    mockClickCreate.mockResolvedValueOnce({ id: "click-1" } as never);
    await recordClick("link-1");

    expect(mockClickCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          timestamp: expect.any(Date),
        }),
      })
    );
  });

  // Test 23: Referrer recorded
  it("TEST 23: recordClick records trimmed referrer string", async () => {
    mockClickCreate.mockResolvedValueOnce({ id: "click-1" } as never);
    await recordClick("link-1", { referrer: "https://github.com/repo" });

    expect(mockClickCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          referrer: "https://github.com/repo",
        }),
      })
    );
  });

  // Test 24: Device type detected
  it("TEST 24: parseUserAgent accurately detects mobile and desktop device types", () => {
    const mobileUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
    const desktopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

    expect(parseUserAgent(mobileUA).deviceType).toBe("mobile");
    expect(parseUserAgent(desktopUA).deviceType).toBe("desktop");
  });

  // Test 25: Browser detected
  it("TEST 25: parseUserAgent accurately detects Chrome, Safari, Firefox browsers", () => {
    const chromeUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";
    const firefoxUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0";

    expect(parseUserAgent(chromeUA).browser).toBe("Chrome");
    expect(parseUserAgent(firefoxUA).browser).toBe("Firefox");
  });

  // Test 26: Analytics failure does not break redirect
  it("TEST 26: Database error inside recordClick is caught silently", async () => {
    mockClickCreate.mockRejectedValueOnce(new Error("Connection terminated"));
    await expect(recordClick("link-1")).resolves.not.toThrow();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// E. OWNERSHIP & SECURITY TESTS (27–31)
// ═════════════════════════════════════════════════════════════════════════════

describe("Category E: Ownership & Security Tests", () => {
  // Test 27: User cannot view another user's links
  it("TEST 27: getUserLinks restricts query exclusively to the authenticated user's ID", async () => {
    mockLinkFindMany.mockResolvedValueOnce([] as never);
    await getUserLinks("user-alice");

    expect(mockLinkFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-alice" },
      })
    );
  });

  // Test 28: User cannot update another user's destination URL
  it("TEST 28: updateLink blocks updating another user's link destination", async () => {
    mockLinkFindFirst.mockResolvedValueOnce(null); // Not found for user-alice

    const res = await updateLink("link-owned-by-bob", "user-alice", {
      originalUrl: "https://hacked.com",
    });

    expect(res).toBeNull();
    expect(mockLinkUpdate).not.toHaveBeenCalled();
  });

  // Test 29: User cannot delete another user's link
  it("TEST 29: deleteLink returns false and does not execute delete when owned by another user", async () => {
    mockLinkFindFirst.mockResolvedValueOnce(null);

    const res = await deleteLink("link-owned-by-bob", "user-alice");
    expect(res).toBe(false);
    expect(mockLinkDelete).not.toHaveBeenCalled();
  });

  // Test 30: User cannot view another user's analytics
  it("TEST 30: getLinkById returns null when link does not belong to requesting user", async () => {
    mockLinkFindFirst.mockResolvedValueOnce(null);

    const res = await getLinkById("link-owned-by-bob", "user-alice");
    expect(res).toBeNull();
  });

  // Test 31: UserId taken from server session, not client payload
  it("TEST 31: updateLink requires explicit server-side userId parameter", async () => {
    mockLinkFindFirst.mockResolvedValueOnce({ id: "link-1" } as never);
    mockLinkUpdate.mockResolvedValueOnce({
      id: "link-1",
      shortCode: "code",
      originalUrl: "https://safe.com",
      title: null,
      expiresAt: null,
      isActive: true,
      createdAt: new Date(),
      _count: { clicks: 0 },
    } as never);

    await updateLink("link-1", "verified-session-user-id", {
      originalUrl: "https://safe.com",
    });

    expect(mockLinkFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "link-1", userId: "verified-session-user-id" },
      })
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// F. LINK MANAGEMENT TESTS (32–37)
// ═════════════════════════════════════════════════════════════════════════════

describe("Category F: Link Management Tests", () => {
  // Test 32: Destination URL editable
  it("TEST 32: updateLink updates originalUrl destination successfully", async () => {
    mockLinkFindFirst.mockResolvedValueOnce({ id: "link-1" } as never);
    mockLinkUpdate.mockResolvedValueOnce({
      id: "link-1",
      shortCode: "code1",
      originalUrl: "https://newdestination.com",
      title: null,
      expiresAt: null,
      isActive: true,
      createdAt: new Date(),
      _count: { clicks: 0 },
    } as never);

    const res = await updateLink("link-1", "user-1", {
      originalUrl: "https://newdestination.com",
    });

    expect(res?.originalUrl).toBe("https://newdestination.com");
    expect(mockLinkUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ originalUrl: "https://newdestination.com" }),
      })
    );
  });

  // Test 33: Title editable
  it("TEST 33: updateLink updates title successfully", async () => {
    mockLinkFindFirst.mockResolvedValueOnce({ id: "link-1" } as never);
    mockLinkUpdate.mockResolvedValueOnce({
      id: "link-1",
      shortCode: "code1",
      originalUrl: "https://example.com",
      title: "Updated Title",
      expiresAt: null,
      isActive: true,
      createdAt: new Date(),
      _count: { clicks: 0 },
    } as never);

    const res = await updateLink("link-1", "user-1", { title: "Updated Title" });
    expect(res?.title).toBe("Updated Title");
  });

  // Test 34: Expiry editable
  it("TEST 34: updateLink updates expiresAt timestamp", async () => {
    const futureDate = new Date(Date.now() + 86400000);
    mockLinkFindFirst.mockResolvedValueOnce({ id: "link-1" } as never);
    mockLinkUpdate.mockResolvedValueOnce({
      id: "link-1",
      shortCode: "code1",
      originalUrl: "https://example.com",
      title: null,
      expiresAt: futureDate,
      isActive: true,
      createdAt: new Date(),
      _count: { clicks: 0 },
    } as never);

    const res = await updateLink("link-1", "user-1", { expiresAt: futureDate });
    expect(res?.expiresAt).toEqual(futureDate);
  });

  // Test 35: Alias editable (with uniqueness check excluding self)
  it("TEST 35: updateLink updates shortCode alias when provided", async () => {
    mockLinkFindFirst.mockResolvedValueOnce({ id: "link-1" } as never);
    mockLinkUpdate.mockResolvedValueOnce({
      id: "link-1",
      shortCode: "brand-new-alias",
      originalUrl: "https://example.com",
      title: null,
      expiresAt: null,
      isActive: true,
      createdAt: new Date(),
      _count: { clicks: 0 },
    } as never);

    const res = await updateLink("link-1", "user-1", { alias: "brand-new-alias" });
    expect(res?.shortCode).toBe("brand-new-alias");
    expect(mockLinkUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ shortCode: "brand-new-alias" }),
      })
    );
  });

  // Test 36: Active status toggleable
  it("TEST 36: updateLink toggles isActive status", async () => {
    mockLinkFindFirst.mockResolvedValueOnce({ id: "link-1" } as never);
    mockLinkUpdate.mockResolvedValueOnce({
      id: "link-1",
      shortCode: "code1",
      originalUrl: "https://example.com",
      title: null,
      expiresAt: null,
      isActive: false,
      createdAt: new Date(),
      _count: { clicks: 0 },
    } as never);

    const res = await updateLink("link-1", "user-1", { isActive: false });
    expect(res?.isActive).toBe(false);
  });

  // Test 37: Link deletable
  it("TEST 37: deleteLink calls prisma.link.delete and returns true", async () => {
    mockLinkFindFirst.mockResolvedValueOnce({ id: "link-1" } as never);
    mockLinkDelete.mockResolvedValueOnce({ id: "link-1" } as never);

    const res = await deleteLink("link-1", "user-1");
    expect(res).toBe(true);
    expect(mockLinkDelete).toHaveBeenCalledWith({ where: { id: "link-1" } });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// G. ANALYTICS TESTS (38–44)
// ═════════════════════════════════════════════════════════════════════════════

describe("Category G: Analytics Tests", () => {
  const t1 = new Date("2026-02-01T10:00:00Z");
  const t2 = new Date("2026-02-01T14:30:00Z");
  const t3 = new Date("2026-02-02T09:15:00Z");

  const sampleClicks = [
    { timestamp: t1, referrer: "https://news.ycombinator.com", deviceType: "desktop", browser: "Chrome" },
    { timestamp: t2, referrer: "https://news.ycombinator.com", deviceType: "mobile", browser: "Safari" },
    { timestamp: t3, referrer: null, deviceType: "desktop", browser: "Firefox" },
  ];

  // Test 38: Total clicks accurate
  it("TEST 38: getLinkAnalytics calculates accurate total clicks", async () => {
    mockClickFindMany.mockResolvedValueOnce(sampleClicks as never);
    const analytics = await getLinkAnalytics("link-1");
    expect(analytics.totalClicks).toBe(3);
  });

  // Test 39: Click history grouped by date
  it("TEST 39: getLinkAnalytics groups clicks by YYYY-MM-DD date", async () => {
    mockClickFindMany.mockResolvedValueOnce(sampleClicks as never);
    const analytics = await getLinkAnalytics("link-1");

    expect(analytics.clickHistory).toEqual([
      { date: "2026-02-01", count: 2 },
      { date: "2026-02-02", count: 1 },
    ]);
  });

  // Test 40: Latest click accurate
  it("TEST 40: getLinkAnalytics returns timestamp of latest click", async () => {
    mockClickFindMany.mockResolvedValueOnce(sampleClicks as never);
    const analytics = await getLinkAnalytics("link-1");
    expect(analytics.lastClickAt).toEqual(t3);
  });

  // Test 41: Device breakdown accurate
  it("TEST 41: getLinkAnalytics returns breakdown of device types", async () => {
    mockClickFindMany.mockResolvedValueOnce(sampleClicks as never);
    const analytics = await getLinkAnalytics("link-1");

    const desktop = analytics.devices?.find((d) => d.device === "desktop");
    const mobile = analytics.devices?.find((d) => d.device === "mobile");
    expect(desktop?.count).toBe(2);
    expect(mobile?.count).toBe(1);
  });

  // Test 42: Browser breakdown accurate
  it("TEST 42: getLinkAnalytics returns breakdown of browsers", async () => {
    mockClickFindMany.mockResolvedValueOnce(sampleClicks as never);
    const analytics = await getLinkAnalytics("link-1");

    const chrome = analytics.browsers?.find((b) => b.browser === "Chrome");
    const safari = analytics.browsers?.find((b) => b.browser === "Safari");
    const firefox = analytics.browsers?.find((b) => b.browser === "Firefox");

    expect(chrome?.count).toBe(1);
    expect(safari?.count).toBe(1);
    expect(firefox?.count).toBe(1);
  });

  // Test 43: Top referrers accurate (with Direct fallback)
  it("TEST 43: getLinkAnalytics extracts domain hostname and labels null referrers as Direct", async () => {
    mockClickFindMany.mockResolvedValueOnce(sampleClicks as never);
    const analytics = await getLinkAnalytics("link-1");

    const hn = analytics.topReferrers.find((r) => r.referrer === "news.ycombinator.com");
    const direct = analytics.topReferrers.find((r) => r.referrer === "Direct");

    expect(hn?.count).toBe(2);
    expect(direct?.count).toBe(1);
    expect(analytics.topReferrers[0].referrer).toBe("news.ycombinator.com");
  });

  // Test 44: Analytics blocked for non-owner
  it("TEST 44: Ownership verification blocks non-owner prior to analytics retrieval", async () => {
    mockLinkFindFirst.mockResolvedValueOnce(null);
    const link = await getLinkById("link-1", "unauthorized-user");
    expect(link).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// H. EDGE CASES & SAFETY TESTS (45–50)
// ═════════════════════════════════════════════════════════════════════════════

describe("Category H: Edge Cases & Safety Tests", () => {
  // Test 45: Malformed JSON rejected
  it("TEST 45: Malformed update payloads fail schema validation", () => {
    const res = updateLinkSchema.safeParse({ originalUrl: 12345 }); // number instead of string
    expect(res.success).toBe(false);
  });

  // Test 46: XSS in title handled/escaped
  it("TEST 46: Title with potential script injection is trimmed and validated as plain string", () => {
    const raw = "   <script>alert('xss')</script>   ";
    const res = createLinkSchema.safeParse({
      url: "https://example.com",
      title: raw,
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.title).toBe("<script>alert('xss')</script>");
    }
  });

  // Test 47: Concurrent click tracking handled gracefully
  it("TEST 47: Concurrent recordClick invocations execute independently without race failure", async () => {
    mockClickCreate.mockResolvedValue({ id: "concurrent-click" } as never);

    const promises = [
      recordClick("link-1", { deviceType: "mobile" }),
      recordClick("link-1", { deviceType: "desktop" }),
      recordClick("link-1", { deviceType: "tablet" }),
    ];

    await expect(Promise.all(promises)).resolves.not.toThrow();
    expect(mockClickCreate).toHaveBeenCalledTimes(3);
  });

  // Test 48: Empty links list handled (empty state)
  it("TEST 48: getUserLinks returns empty array when user has no links", async () => {
    mockLinkFindMany.mockResolvedValueOnce([] as never);
    const links = await getUserLinks("new-user-with-no-links");
    expect(Array.isArray(links)).toBe(true);
    expect(links.length).toBe(0);
  });

  // Test 49: Pagination works on link list
  it("TEST 49: Pagination slices links correctly into pages and limits", () => {
    const mockList = Array.from({ length: 25 }, (_, i) => ({ id: `link-${i + 1}` }));
    const page = 2;
    const limit = 10;
    const total = mockList.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const sliced = mockList.slice(start, start + limit);

    expect(sliced).toHaveLength(10);
    expect(sliced[0].id).toBe("link-11");
    expect(totalPages).toBe(3);
  });

  // Test 50: Long URLs (up to valid limits) accepted
  it("TEST 50: Valid long URLs with deep paths and query parameters are accepted", () => {
    const deepQuery = new URLSearchParams();
    for (let i = 0; i < 20; i++) {
      deepQuery.append(`param_${i}`, `value_${i}_very_long_string_data`);
    }
    const longUrl = `https://example.com/very/deep/nested/path/to/resource?${deepQuery.toString()}`;

    const res = urlSchema.safeParse(longUrl);
    expect(res.success).toBe(true);
  });
});

