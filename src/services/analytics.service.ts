import { prisma } from "@/lib/prisma";

export interface RecordClickOptions {
  referrer?: string | null;
  deviceType?: string | null;
  browser?: string | null;
}

/**
 * Record a click event for a given link.
 * Fails silently — analytics failures must not break redirect.
 */
export async function recordClick(
  linkId: string,
  options?: RecordClickOptions
): Promise<void> {
  try {
    await prisma.click.create({
      data: {
        linkId,
        timestamp: new Date(),
        referrer: options?.referrer ? options.referrer.slice(0, 500) : null,
        deviceType: options?.deviceType ?? null,
        browser: options?.browser ?? null,
      },
    });
  } catch (err) {
    console.error("[analytics] Failed to record click:", err);
    // Do NOT rethrow — redirect must succeed even if analytics fails
  }
}

export interface ClickSummary {
  totalClicks: number;
  lastClickAt: Date | null;
  clickHistory: { date: string; count: number }[];
  devices?: { device: string; count: number }[];
  browsers?: { browser: string; count: number }[];
  referrers?: { referrer: string; count: number }[];
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
    if (c.referrer) {
      try {
        const host = new URL(c.referrer).hostname;
        countByReferrer[host] = (countByReferrer[host] ?? 0) + 1;
      } catch {
        countByReferrer[c.referrer] = (countByReferrer[c.referrer] ?? 0) + 1;
      }
    }
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

  const referrers = Object.entries(countByReferrer).map(([referrer, count]) => ({
    referrer,
    count,
  }));

  return { totalClicks, lastClickAt, clickHistory, devices, browsers, referrers };
}
