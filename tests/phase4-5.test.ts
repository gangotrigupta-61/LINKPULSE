/**
 * Phase 4 & 5 Test Suite — redirect, link management, analytics
 *
 * Uses vi.mock to mock Prisma so tests run entirely in-process
 * without needing a live database connection.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma before any imports that use it ───────────────────────────────

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

// ─── Now import services (they will pick up the mocked prisma) ────────────────

import { prisma } from "@/lib/prisma";
import { resolveShortCode } from "@/services/redirect.service";
import {
  recordClick,
  getLinkAnalytics,
} from "@/services/analytics.service";
import {
  getUserLinks,
  getLinkById,
  updateLink,
  deleteLink,
} from "@/services/link-management.service";
import { createLink } from "@/services/links.service";
import { updateLinkSchema } from "@/validators/link.validators";

// ─── Typed helpers ────────────────────────────────────────────────────────────

const mockLinkFindFirst = vi.mocked(prisma.link.findFirst);
const mockLinkFindMany = vi.mocked(prisma.link.findMany);
const mockLinkCreate = vi.mocked(prisma.link.create);
const mockLinkUpdate = vi.mocked(prisma.link.update);
const mockLinkDelete = vi.mocked(prisma.link.delete);
const mockClickCreate = vi.mocked(prisma.click.create);
const mockClickFindMany = vi.mocked(prisma.click.findMany);

// Base URL used by services
const BASE_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_APP_URL = BASE_URL;

// ─── Helper: mock link record ─────────────────────────────────────────────────

function makeLink(overrides: Partial<{
  id: string;
  shortCode: string;
  originalUrl: string;
  userId: string;
  isActive: boolean;
  expiresAt: Date | null;
  title: string | null;
  createdAt: Date;
  clickCount: number;
}> = {}) {
  return {
    id: overrides.id ?? "link-id-1",
    shortCode: overrides.shortCode ?? "abc1234",
    originalUrl: overrides.originalUrl ?? "https://example.com",
    userId: overrides.userId ?? "user-a-id",
    isActive: overrides.isActive ?? true,
    expiresAt: overrides.expiresAt ?? null,
    title: overrides.title ?? null,
    createdAt: overrides.createdAt ?? new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date(),
    _count: { clicks: overrides.clickCount ?? 0 },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ═════════════════════════════════════════════════════════════════════════════
// PHASE 4 & 5 TESTS
// ═════════════════════════════════════════════════════════════════════════════

// ─── TEST 1: Authenticated owner can update originalUrl ───────────────────────

describe("TEST 1: Authenticated owner can update originalUrl", () => {
  it("allows owner to update destination originalUrl", async () => {
    mockLinkFindFirst.mockResolvedValueOnce({ id: "link-id-1" } as never);
    mockLinkUpdate.mockResolvedValueOnce({
      id: "link-id-1",
      shortCode: "abc1234",
      originalUrl: "https://updated-destination.example.com",
      title: "Updated Title",
      expiresAt: null,
      isActive: true,
      createdAt: new Date(),
      _count: { clicks: 0 },
    } as never);

    const result = await updateLink("link-id-1", "user-a-id", {
      originalUrl: "https://updated-destination.example.com",
      title: "Updated Title",
    });

    expect(result).not.toBeNull();
    expect(result?.originalUrl).toBe("https://updated-destination.example.com");
    expect(mockLinkUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "link-id-1" },
        data: expect.objectContaining({
          originalUrl: "https://updated-destination.example.com",
        }),
      })
    );
  });
});

// ─── TEST 2: Invalid originalUrl is rejected using Phase 3 validation rules ───

describe("TEST 2: Invalid originalUrl rejected with Phase 3 validation rules", () => {
  it("rejects non-url string", () => {
    const res = updateLinkSchema.safeParse({ originalUrl: "not-a-valid-url" });
    expect(res.success).toBe(false);
  });

  it("rejects dangerous javascript: protocol", () => {
    const res = updateLinkSchema.safeParse({ originalUrl: "javascript:alert(1)" });
    expect(res.success).toBe(false);
  });

  it("rejects ftp: protocol", () => {
    const res = updateLinkSchema.safeParse({ originalUrl: "ftp://files.example.com" });
    expect(res.success).toBe(false);
  });

  it("accepts valid http and https URLs", () => {
    const resHttp = updateLinkSchema.safeParse({ originalUrl: "http://example.com" });
    const resHttps = updateLinkSchema.safeParse({ originalUrl: "https://example.com/path" });
    expect(resHttp.success).toBe(true);
    expect(resHttps.success).toBe(true);
  });
});

// ─── TEST 3: User A cannot update User B's originalUrl ───────────────────────

describe("TEST 3: User A cannot update User B's originalUrl", () => {
  it("blocks User A from changing destination URL of User B's link", async () => {
    // Ownership findFirst returns null = user does not own link
    mockLinkFindFirst.mockResolvedValueOnce(null);

    const result = await updateLink("user-b-link-id", "user-a-id", {
      originalUrl: "https://malicious-hijack.com",
    });

    expect(result).toBeNull();
    expect(mockLinkUpdate).not.toHaveBeenCalled();
  });
});

// ─── TEST 4: Successful redirect records referrer ────────────────────────────

describe("TEST 4: Successful redirect records referrer", () => {
  it("records referrer, deviceType, and browser safely on click", async () => {
    mockClickCreate.mockResolvedValueOnce({
      id: "click-1",
      linkId: "link-id-1",
      timestamp: new Date(),
    } as never);

    await recordClick("link-id-1", {
      referrer: "https://twitter.com/some/tweet",
      deviceType: "mobile",
      browser: "Chrome",
    });

    expect(mockClickCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          linkId: "link-id-1",
          referrer: "https://twitter.com/some/tweet",
          deviceType: "mobile",
          browser: "Chrome",
        }),
      })
    );
  });
});

// ─── TEST 5: Analytics returns top referrers with correct counts ─────────────

describe("TEST 5: Analytics returns top referrers with correct counts", () => {
  it("aggregates and ranks referrers, mapping missing referrer to Direct", async () => {
    const now = new Date();
    mockClickFindMany.mockResolvedValueOnce([
      { timestamp: now, referrer: "https://github.com/trending", deviceType: "desktop", browser: "Chrome" },
      { timestamp: now, referrer: "https://github.com/dashboard", deviceType: "desktop", browser: "Chrome" },
      { timestamp: now, referrer: null, deviceType: "mobile", browser: "Safari" }, // Direct
      { timestamp: now, referrer: "https://google.com/search", deviceType: "desktop", browser: "Edge" },
    ] as never);

    const analytics = await getLinkAnalytics("link-id-1");

    expect(analytics.totalClicks).toBe(4);
    expect(analytics.topReferrers).toBeDefined();

    const github = analytics.topReferrers.find((r) => r.referrer === "github.com");
    const direct = analytics.topReferrers.find((r) => r.referrer === "Direct");
    const google = analytics.topReferrers.find((r) => r.referrer === "google.com");

    expect(github?.count).toBe(2);
    expect(direct?.count).toBe(1);
    expect(google?.count).toBe(1);

    // Ensure sorted descending by count
    expect(analytics.topReferrers[0].referrer).toBe("github.com");
  });
});

// ─── TEST 6: Existing Phase 3 link creation still passes ─────────────────────

describe("TEST 6: Existing Phase 3 authenticated link creation", () => {
  it("creates a link for an authenticated user with shortCode and shortUrl", async () => {
    mockLinkFindFirst.mockResolvedValueOnce(null);
    mockLinkCreate.mockResolvedValueOnce({
      id: "new-link-id",
      shortCode: "abc1234",
      originalUrl: "https://regression-test.example.com",
      userId: "user-a-id",
      title: null,
      expiresAt: null,
      isActive: true,
      createdAt: new Date(),
    } as never);

    const link = await createLink({
      userId: "user-a-id",
      url: "https://regression-test.example.com",
    });

    expect(link.id).toBe("new-link-id");
    expect(link.originalUrl).toBe("https://regression-test.example.com");
    expect(link.isActive).toBe(true);
    expect(link.shortUrl).toContain(link.shortCode);
  });
});

// ─── TEST 7: Existing redirect, ownership, analytics & deletion pass ─────────

describe("TEST 7: Existing redirect, ownership, analytics, and deletion tests", () => {
  it("resolves active shortCode to original destination URL", async () => {
    mockLinkFindFirst.mockResolvedValueOnce({
      id: "link-id-1",
      originalUrl: "https://valid-redirect.example.com",
      isActive: true,
      expiresAt: null,
    } as never);

    const result = await resolveShortCode("abc1234");
    expect(result.status).toBe("ok");
    expect(result.originalUrl).toBe("https://valid-redirect.example.com");
  });

  it("returns not_found for unknown shortCode", async () => {
    mockLinkFindFirst.mockResolvedValueOnce(null);
    const result = await resolveShortCode("unknown99");
    expect(result.status).toBe("not_found");
  });

  it("returns not_found for reserved words without querying DB", async () => {
    const result = await resolveShortCode("dashboard");
    expect(result.status).toBe("not_found");
    expect(mockLinkFindFirst).not.toHaveBeenCalled();
  });

  it("does not redirect expired links", async () => {
    mockLinkFindFirst.mockResolvedValueOnce({
      id: "link-id-1",
      originalUrl: "https://example.com",
      isActive: true,
      expiresAt: new Date(Date.now() - 60_000),
    } as never);

    const result = await resolveShortCode("expired1");
    expect(result.status).toBe("expired");
  });

  it("does not redirect disabled links", async () => {
    mockLinkFindFirst.mockResolvedValueOnce({
      id: "link-id-1",
      originalUrl: "https://example.com",
      isActive: false,
      expiresAt: null,
    } as never);

    const result = await resolveShortCode("disabled1");
    expect(result.status).toBe("inactive");
  });

  it("restricts getUserLinks to the authenticated user", async () => {
    const linkA = makeLink({ id: "link-a-1", userId: "user-a-id" });
    mockLinkFindMany.mockResolvedValueOnce([linkA] as never);

    const links = await getUserLinks("user-a-id");
    expect(mockLinkFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-a-id" },
      })
    );
    expect(links).toHaveLength(1);
    expect(links[0].id).toBe("link-a-1");
  });

  it("restricts getLinkById to owner", async () => {
    mockLinkFindFirst.mockResolvedValueOnce(null);
    const result = await getLinkById("user-b-link", "user-a-id");
    expect(result).toBeNull();
  });

  it("deletes link correctly when owned by user", async () => {
    mockLinkFindFirst.mockResolvedValueOnce({ id: "link-id-1" } as never);
    mockLinkDelete.mockResolvedValueOnce({ id: "link-id-1" } as never);

    const deleted = await deleteLink("link-id-1", "user-a-id");
    expect(deleted).toBe(true);
    expect(mockLinkDelete).toHaveBeenCalledWith({ where: { id: "link-id-1" } });
  });

  it("does not allow deleting another user's link", async () => {
    mockLinkFindFirst.mockResolvedValueOnce(null);

    const deleted = await deleteLink("user-b-link", "user-a-id");
    expect(deleted).toBe(false);
    expect(mockLinkDelete).not.toHaveBeenCalled();
  });

  it("analytics failure does not throw or break redirect", async () => {
    mockClickCreate.mockRejectedValueOnce(new Error("DB timeout"));
    await expect(recordClick("link-id-1")).resolves.not.toThrow();
  });
});
