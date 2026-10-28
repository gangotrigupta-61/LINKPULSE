/**
 * Phase 4 & 5 Test Suite — redirect, link management, analytics
 *
 * Uses vi.mock to mock Prisma so tests run entirely in-process
 * without needing a live database connection.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma before any imports that use it ───────────────────────────────

vi.mock("@/lib/prisma", () => {
  const link = vi.fn();
  const click = vi.fn();
  const user = vi.fn();

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
      _dummy: { link, click, user },
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
// PHASE 4 TESTS
// ═════════════════════════════════════════════════════════════════════════════

// ─── TEST 1: Phase 3 regression — link creation ───────────────────────────────

describe("TEST 1: Phase 3 regression — link creation", () => {
  it("creates a link for an authenticated user", async () => {
    // First findFirst (collision check) returns null = no collision
    mockLinkFindFirst.mockResolvedValue(null);
    mockLinkCreate.mockResolvedValue({
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

// ─── TEST 2: Valid shortCode redirects to correct URL ─────────────────────────

describe("TEST 2: Valid shortCode resolves to original URL", () => {
  it("resolves an active link to its original URL", async () => {
    mockLinkFindFirst.mockResolvedValue({
      id: "link-id-1",
      originalUrl: "https://valid-redirect.example.com",
      isActive: true,
      expiresAt: null,
    } as never);

    const result = await resolveShortCode("abc1234");
    expect(result.status).toBe("ok");
    expect(result.originalUrl).toBe("https://valid-redirect.example.com");
    expect(result.linkId).toBe("link-id-1");
  });
});

// ─── TEST 3: Unknown shortCode returns not_found ──────────────────────────────

describe("TEST 3: Unknown shortCode returns not_found", () => {
  it("returns not_found for a non-existent code", async () => {
    mockLinkFindFirst.mockResolvedValue(null);

    const result = await resolveShortCode("xxxxxxx");
    expect(result.status).toBe("not_found");
    expect(result.originalUrl).toBeUndefined();
  });

  it("returns not_found for reserved words without querying the DB", async () => {
    const result = await resolveShortCode("dashboard");
    expect(result.status).toBe("not_found");
    expect(mockLinkFindFirst).not.toHaveBeenCalled();
  });
});

// ─── TEST 4: Expired link does not redirect ───────────────────────────────────

describe("TEST 4: Expired link does not redirect", () => {
  it("returns expired for a link whose expiresAt is in the past", async () => {
    mockLinkFindFirst.mockResolvedValue({
      id: "link-id-1",
      originalUrl: "https://example.com",
      isActive: true,
      expiresAt: new Date(Date.now() - 60_000), // 1 minute ago
    } as never);

    const result = await resolveShortCode("expired1");
    expect(result.status).toBe("expired");
  });
});

// ─── TEST 5: Disabled link does not redirect ──────────────────────────────────

describe("TEST 5: Disabled link does not redirect", () => {
  it("returns inactive for a deactivated link", async () => {
    mockLinkFindFirst.mockResolvedValue({
      id: "link-id-1",
      originalUrl: "https://example.com",
      isActive: false,
      expiresAt: null,
    } as never);

    const result = await resolveShortCode("inactive");
    expect(result.status).toBe("inactive");
  });
});

// ─── TEST 6: Click tracking works for valid redirects ────────────────────────

describe("TEST 6: Click tracking records clicks", () => {
  it("records a click without throwing", async () => {
    mockClickCreate.mockResolvedValue({ id: "click-1", linkId: "link-id-1", timestamp: new Date() } as never);

    await expect(recordClick("link-id-1")).resolves.not.toThrow();
    expect(mockClickCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ linkId: "link-id-1" }) })
    );
  });
});

// ─── TEST 7: Unauthenticated / wrong user returns empty results ──────────────

describe("TEST 7: Service enforces ownership (userId scoping)", () => {
  it("getUserLinks returns empty array when userId matches no links", async () => {
    mockLinkFindMany.mockResolvedValue([] as never);

    const links = await getUserLinks("non-existent-user-id");
    expect(links).toHaveLength(0);
  });

  it("getLinkById returns null when no link matches userId", async () => {
    mockLinkFindFirst.mockResolvedValue(null);

    const result = await getLinkById("link-id-1", "wrong-user-id");
    expect(result).toBeNull();
    // Verify the userId was used in the where clause
    expect(mockLinkFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "wrong-user-id" }),
      })
    );
  });
});

// ─── TEST 8: User A cannot see User B's links ─────────────────────────────────

describe("TEST 8: User A cannot access User B's links", () => {
  it("getLinkById returns null when userA queries userB's link", async () => {
    // Simulate: link exists for userB, but userId filter makes it return null
    mockLinkFindFirst.mockResolvedValue(null);

    const result = await getLinkById("user-b-link-id", "user-a-id");
    expect(result).toBeNull();
  });

  it("getUserLinks only returns links scoped to that userId", async () => {
    const linkA = makeLink({ id: "link-a-1", userId: "user-a-id" });
    mockLinkFindMany.mockResolvedValue([linkA] as never);

    const links = await getUserLinks("user-a-id");
    // Verify the where clause uses the correct userId
    expect(mockLinkFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-a-id" },
      })
    );
    expect(links.every((l) => l.id === "link-a-1")).toBe(true);
  });
});

// ─── TEST 9: User A cannot update/delete User B's link ───────────────────────

describe("TEST 9: User A cannot update or delete User B's link", () => {
  it("updateLink returns null when ownership check fails", async () => {
    // Ownership findFirst returns null = user doesn't own this link
    mockLinkFindFirst.mockResolvedValue(null);

    const result = await updateLink("user-b-link-id", "user-a-id", { isActive: false });
    expect(result).toBeNull();
    // prisma.link.update must NOT be called
    expect(mockLinkUpdate).not.toHaveBeenCalled();
  });

  it("deleteLink returns false when ownership check fails", async () => {
    mockLinkFindFirst.mockResolvedValue(null);

    const result = await deleteLink("user-b-link-id", "user-a-id");
    expect(result).toBe(false);
    expect(mockLinkDelete).not.toHaveBeenCalled();
  });
});

// ─── TEST 10: User A cannot access User B's analytics ────────────────────────

describe("TEST 10: Analytics ownership enforcement", () => {
  it("getLinkById with wrong userId returns null (blocks analytics)", async () => {
    mockLinkFindFirst.mockResolvedValue(null);

    const ownershipCheck = await getLinkById("user-b-link-id", "user-a-id");
    expect(ownershipCheck).toBeNull();
    // API route would return 404 here, preventing analytics access
  });
});

// ─── TEST 11: Delete operation removes the link ───────────────────────────────

describe("TEST 11: Delete removes the link correctly", () => {
  it("deleteLink calls prisma.link.delete when user owns the link", async () => {
    mockLinkFindFirst.mockResolvedValue({ id: "link-id-1" } as never);
    mockLinkDelete.mockResolvedValue({ id: "link-id-1" } as never);

    const result = await deleteLink("link-id-1", "user-a-id");
    expect(result).toBe(true);
    expect(mockLinkDelete).toHaveBeenCalledWith({ where: { id: "link-id-1" } });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PHASE 5 TESTS
// ═════════════════════════════════════════════════════════════════════════════

// ─── TEST 12: Analytics returns correct click count ──────────────────────────

describe("TEST 12: Analytics correct click count", () => {
  it("returns the exact number of recorded clicks", async () => {
    const now = new Date();
    mockClickFindMany.mockResolvedValue([
      { timestamp: now },
      { timestamp: now },
      { timestamp: now },
    ] as never);

    const analytics = await getLinkAnalytics("link-id-1");
    expect(analytics.totalClicks).toBe(3);
  });
});

// ─── TEST 13: Analytics returns click history ─────────────────────────────────

describe("TEST 13: Analytics returns click history", () => {
  it("groups clicks by date and returns history array", async () => {
    const d1 = new Date("2026-10-20T10:00:00Z");
    const d2 = new Date("2026-10-21T10:00:00Z");

    mockClickFindMany.mockResolvedValue([
      { timestamp: d1 },
      { timestamp: d1 },
      { timestamp: d2 },
    ] as never);

    const analytics = await getLinkAnalytics("link-id-1");
    expect(analytics.clickHistory.length).toBe(2);

    const day1 = analytics.clickHistory.find((h) => h.date === "2026-10-20");
    const day2 = analytics.clickHistory.find((h) => h.date === "2026-10-21");

    expect(day1?.count).toBe(2);
    expect(day2?.count).toBe(1);
  });

  it("returns lastClickAt as the most recent timestamp", async () => {
    const ts1 = new Date("2026-10-20T10:00:00Z");
    const ts2 = new Date("2026-10-21T15:30:00Z");

    mockClickFindMany.mockResolvedValue([
      { timestamp: ts1 },
      { timestamp: ts2 },
    ] as never);

    const analytics = await getLinkAnalytics("link-id-1");
    expect(analytics.lastClickAt).toEqual(ts2);
  });
});

// ─── TEST 14: Analytics restricted to link owner ─────────────────────────────

describe("TEST 14: Analytics restricted to link owner", () => {
  it("ownership check (getLinkById) blocks wrong user", async () => {
    // Wrong user gets null
    mockLinkFindFirst.mockResolvedValueOnce(null);
    const blocked = await getLinkById("user-b-link-id", "user-a-id");
    expect(blocked).toBeNull();
  });

  it("owner can access their own link details", async () => {
    const linkB = makeLink({ id: "link-b-1", userId: "user-b-id", clickCount: 5 });
    mockLinkFindFirst.mockResolvedValueOnce(linkB as never);

    const result = await getLinkById("link-b-1", "user-b-id");
    expect(result).not.toBeNull();
    expect(result?.clickCount).toBe(5);
  });
});

// ─── TEST 15: Analytics failure does not break public redirection ─────────────

describe("TEST 15: Analytics failure does not break redirect", () => {
  it("recordClick swallows DB errors silently", async () => {
    mockClickCreate.mockRejectedValue(new Error("DB connection failed"));

    // Should NOT throw
    await expect(recordClick("any-link-id")).resolves.not.toThrow();
  });

  it("resolveShortCode works even when analytics would fail", async () => {
    mockLinkFindFirst.mockResolvedValue({
      id: "link-id-1",
      originalUrl: "https://example.com",
      isActive: true,
      expiresAt: null,
    } as never);

    const resolved = await resolveShortCode("abc1234");
    expect(resolved.status).toBe("ok");

    // Even if analytics fails, no throw
    mockClickCreate.mockRejectedValue(new Error("Analytics error"));
    await expect(recordClick("link-id-1")).resolves.not.toThrow();
  });
});
