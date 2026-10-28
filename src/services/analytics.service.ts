import { prisma } from "@/lib/prisma";

export interface RecordClickOptions {
  referrer?: string | null;
  deviceType?: string | null;
  browser?: string | null;
}

/**
 * Record a click event for a given link.
 * Fails silently — analytics failures must not break redirect.
 * Does NOT collect or store raw IP addresses.
 */
export async function recordClick(
  linkId: string,
  options?: RecordClickOptions
): Promise<void> {
  try {
    const trimmedReferrer = options?.referrer?.trim()
      ? options.referrer.trim().slice(0, 500)
      : null;

    await prisma.click.create({
      data: {
        linkId,
        timestamp: new Date(),
        referrer: trimmedReferrer,
        deviceType: options?.deviceType ?? null,
        browser: options?.browser ?? null,
      },
    });
  } catch (err) {
    console.error("[analytics] Failed to record click:", err);
    // Do NOT rethrow — redirect must succeed even if analytics fails
  }
}

export interface ReferrerMetric {
  referrer: string;
  count: number;
}

export interface ClickSummary {
  totalClicks: number;
  lastClickAt: Date | null;
  clickHistory: { date: string; count: number }[];
  topReferrers: ReferrerMetric[];
  devices?: { device: string; count: number }[];
  browsers?: { browser: string; count: number }[];
  referrers?: ReferrerMetric[];
}

/**
 * Aggregate analytics for a given link.
 * Verify ownership before calling this.
 */
export async function getLinkAnalytics(linkId: string): Promise<ClickSummary> {
  const clicks = await prisma.click.findMany({
    where: { linkId },
    select: {
      timestamp: true,
      referrer: true,
      deviceType: true,
      browser: true,
    },
    orderBy: { timestamp: "asc" },
  });

  const totalClicks = clicks.length;
  const lastClickAt =
    clicks.length > 0 ? clicks[clicks.length - 1].timestamp : null;

  // Aggregate by date (YYYY-MM-DD)
  const countByDate: Record<string, number> = {};
  const countByDevice: Record<string, number> = {};
  const countByBrowser: Record<string, number> = {};
  const countByReferrer: Record<string, number> = {};

  for (const c of clicks) {
    const day = c.timestamp.toISOString().slice(0, 10);
    countByDate[day] = (countByDate[day] ?? 0) + 1;

    if (c.deviceType) {
      countByDevice[c.deviceType] = (countByDevice[c.deviceType] ?? 0) + 1;
    }
    if (c.browser) {
      countByBrowser[c.browser] = (countByBrowser[c.browser] ?? 0) + 1;
    }

    // Safely label missing or empty referrer as "Direct"
    let refKey = "Direct";
    if (c.referrer && c.referrer.trim()) {
      try {
        const parsed = new URL(c.referrer);
        refKey = parsed.hostname || c.referrer.trim();
      } catch {
        refKey = c.referrer.trim().slice(0, 100);
      }
    }
    countByReferrer[refKey] = (countByReferrer[refKey] ?? 0) + 1;
  }

  const clickHistory = Object.entries(countByDate).map(([date, count]) => ({
    date,
    count,
  }));

  const devices = Object.entries(countByDevice).map(([device, count]) => ({
    device,
    count,
  }));

  const browsers = Object.entries(countByBrowser).map(([browser, count]) => ({
    browser,
    count,
  }));

  const topReferrers = Object.entries(countByReferrer)
    .map(([referrer, count]) => ({
      referrer,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalClicks,
    lastClickAt,
    clickHistory,
    topReferrers,
    devices,
    browsers,
    referrers: topReferrers,
  };
}
