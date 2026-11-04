import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getLinkById } from "@/services/link-management.service";
import { getLinkAnalytics } from "@/services/analytics.service";
import { CopyButton } from "@/components/copy-button";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return { title: "Link Analytics | LinkPulse" };
  }
  const link = await getLinkById(id, session.user.id);
  return {
    title: link ? `${link.title || link.shortCode} - Analytics | LinkPulse` : "Link Analytics | LinkPulse",
  };
}

export default async function LinkDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/links/${id}`)}`);
  }

  const link = await getLinkById(id, session.user.id);
  if (!link) {
    notFound();
  }

  const analytics = await getLinkAnalytics(id);
  const isExpired = link.isExpired;

  // Compute max count for trend bars
  const maxTrend = Math.max(1, ...(analytics.clickHistory?.map((c) => c.count) ?? [1]));
  const recentHistory = analytics.clickHistory.slice(-14);

  return (
    <main className="detail-page">
      <div className="detail-container">
        {/* Navigation & Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
          <Link href="/dashboard" className="detail-back-link">
            ← Back to Dashboard
          </Link>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <CopyButton text={link.shortUrl} label="Copy Short Link" />
            <Link
              href={`/links/${link.id}/edit`}
              className="form-button"
              style={{
                width: "auto",
                padding: "var(--space-2) var(--space-4)",
                fontSize: "var(--text-xs)",
                background: "var(--color-accent)",
                color: "#ffffff",
                borderRadius: "var(--radius-md)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
              }}
            >
              ✏️ Edit Link
            </Link>
          </div>
        </div>

        {/* Link Title & Identity */}
        <div className="detail-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-2)" }}>
            <div>
              <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-bold)", color: "var(--color-text)" }}>
                {link.title || link.shortCode}
              </h1>
              <a
                href={link.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="auth-link"
                style={{ fontSize: "var(--text-base)", fontFamily: "var(--font-mono)" }}
              >
                {link.shortUrl}
              </a>
            </div>

            <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
              {isExpired && (
                <span
                  style={{
                    padding: "3px 10px",
                    background: "rgba(245,158,11,0.15)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: "var(--radius-full)",
                    fontSize: "var(--text-xs)",
                    color: "var(--color-warning)",
                    fontWeight: "var(--font-semibold)",
                  }}
                >
                  Expired
                </span>
              )}
              <span
                style={{
                  padding: "3px 10px",
                  background: link.isActive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                  border: `1px solid ${link.isActive ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-xs)",
                  color: link.isActive ? "var(--color-success)" : "var(--color-error)",
                  fontWeight: "var(--font-semibold)",
                }}
              >
                {link.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <div className="detail-row">
              <span className="detail-label">Destination URL:</span>
              <a
                href={link.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="detail-value auth-link"
              >
                {link.originalUrl}
              </a>
            </div>
            <div className="detail-row">
              <span className="detail-label">Short Code / Alias:</span>
              <span className="detail-value" style={{ fontFamily: "var(--font-mono)" }}>
                {link.shortCode}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Created:</span>
              <span className="detail-value">
                {new Date(link.createdAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
            {link.expiresAt && (
              <div className="detail-row">
                <span className="detail-label">Expiration:</span>
                <span
                  className="detail-value"
                  style={{ color: isExpired ? "var(--color-warning)" : "var(--color-text)" }}
                >
                  {new Date(link.expiresAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {isExpired && " (Past)"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Clicks Summary Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-card-value">{analytics.totalClicks}</span>
            <span className="stat-card-label">Total Clicks</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-value" style={{ fontSize: "var(--text-lg)", color: "var(--color-text)", wordBreak: "break-word" }}>
              {analytics.lastClickAt
                ? new Date(analytics.lastClickAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "No clicks yet"}
            </span>
            <span className="stat-card-label">Latest Click</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-value" style={{ fontSize: "var(--text-xl)", color: link.isActive && !isExpired ? "var(--color-success)" : "var(--color-error)" }}>
              {link.isActive && !isExpired ? "Ready" : isExpired ? "Expired" : "Disabled"}
            </span>
            <span className="stat-card-label">Link Status</span>
          </div>
        </div>

        {/* Click Trend Chart */}
        <div className="detail-card">
          <h2 className="detail-card-title">Click Trend (Recent Days)</h2>
          {recentHistory.length > 0 ? (
            <div>
              <div className="chart-bars" style={{ height: "80px", alignItems: "flex-end" }}>
                {recentHistory.map((item) => {
                  const barHeight = Math.max(6, (item.count / maxTrend) * 80);
                  return (
                    <div
                      key={item.date}
                      className="chart-bar"
                      style={{ height: `${barHeight}px` }}
                      title={`${item.date}: ${item.count} click${item.count !== 1 ? "s" : ""}`}
                    />
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                <span>{recentHistory[0]?.date}</span>
                <span>{recentHistory[recentHistory.length - 1]?.date}</span>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              No click history recorded yet. Share your short link to start tracking!
            </p>
          )}
        </div>

        {/* Top Referrers */}
        <div className="detail-card">
          <h2 className="detail-card-title">Top Referrers</h2>
          {analytics.topReferrers && analytics.topReferrers.length > 0 ? (
            <div className="referrer-list">
              {analytics.topReferrers.map((ref) => (
                <div key={ref.referrer} className="referrer-row">
                  <span className="referrer-name">{ref.referrer}</span>
                  <span className="referrer-count">
                    {ref.count} {ref.count === 1 ? "click" : "clicks"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              No referrer information yet. Referrers will appear as visitors arrive.
            </p>
          )}
        </div>

        {/* Devices and Browsers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
          {/* Device breakdown */}
          <div className="detail-card">
            <h2 className="detail-card-title">Device Breakdown</h2>
            {analytics.devices && analytics.devices.length > 0 ? (
              <div className="breakdown-tags">
                {analytics.devices.map((d) => (
                  <span key={d.device} className="breakdown-tag breakdown-tag--device">
                    {d.device}: <strong>{d.count}</strong>
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                No device data available.
              </p>
            )}
          </div>

          {/* Browser breakdown */}
          <div className="detail-card">
            <h2 className="detail-card-title">Browser Breakdown</h2>
            {analytics.browsers && analytics.browsers.length > 0 ? (
              <div className="breakdown-tags">
                {analytics.browsers.map((b) => (
                  <span key={b.browser} className="breakdown-tag breakdown-tag--browser">
                    {b.browser}: <strong>{b.count}</strong>
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                No browser data available.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

