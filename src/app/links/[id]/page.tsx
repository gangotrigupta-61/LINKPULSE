import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getLinkById } from "@/services/link-management.service";
import { getLinkAnalytics } from "@/services/analytics.service";
import { AppNavbar } from "@/components/app-navbar";
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
    title: link
      ? `${link.title || link.shortCode} - Analytics | LinkPulse`
      : "Link Analytics | LinkPulse",
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
  const recentHistory = analytics.clickHistory.slice(-14);
  const maxTrend = Math.max(
    1,
    ...(recentHistory.length > 0 ? recentHistory.map((c) => c.count) : [1])
  );
  const totalClicksDenominator = Math.max(1, analytics.totalClicks);

  return (
    <>
      <AppNavbar
        user={session.user}
        activePage="analytics"
        analyticsHref={`/links/${link.id}`}
      />
      <main className="workspace-page">
        <div className="workspace-container">
          {/* Top Breadcrumb & Actions */}
          <div className="workspace-header">
            <div className="workspace-heading-group">
              <Link href="/dashboard" className="detail-back-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to Dashboard
              </Link>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap", marginTop: "var(--space-1)" }}>
                <h1 className="workspace-title">
                  {link.title || link.shortCode}
                </h1>
                {isExpired && (
                  <span className="status-badge status-badge--expired">
                    <span className="status-dot" aria-hidden="true" />
                    Expired
                  </span>
                )}
                <span
                  className={`status-badge ${
                    link.isActive ? "status-badge--active" : "status-badge--inactive"
                  }`}
                >
                  <span className="status-dot" aria-hidden="true" />
                  {link.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <a
                href={link.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="auth-link"
                style={{ fontSize: "var(--text-sm)", fontFamily: "var(--font-mono)" }}
              >
                {link.shortUrl}
              </a>
            </div>

            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <CopyButton text={link.shortUrl} label="Copy Short Link" />
              <Link
                href={`/links/${link.id}/edit`}
                className="btn btn-primary btn-sm"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Link
              </Link>
            </div>
          </div>

          {/* Clicks Summary Cards */}
          <section className="kpi-grid" aria-label="Link performance summary">
            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-label">Total Clicks</span>
              </div>
              <div className="kpi-value kpi-value--accent">
                {analytics.totalClicks}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-label">Latest Click</span>
              </div>
              <div className="kpi-value" style={{ fontSize: "var(--text-xl)" }}>
                {analytics.lastClickAt
                  ? new Date(analytics.lastClickAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "No clicks yet"}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-label">Link Status</span>
              </div>
              <div
                className={`kpi-value ${
                  link.isActive && !isExpired ? "kpi-value--success" : ""
                }`}
                style={{
                  fontSize: "var(--text-xl)",
                  color:
                    link.isActive && !isExpired
                      ? undefined
                      : isExpired
                      ? "#fbbf24"
                      : "#f87171",
                }}
              >
                {link.isActive && !isExpired
                  ? "Ready"
                  : isExpired
                  ? "Expired"
                  : "Disabled"}
              </div>
            </div>
          </section>

          {/* Link Metadata */}
          <section className="detail-card" aria-labelledby="link-details-heading">
            <div className="panel-header">
              <h2 id="link-details-heading" className="detail-card-title">
                Link Details
              </h2>
            </div>

            <div className="detail-meta-grid" style={{ borderTop: "none", paddingTop: 0 }}>
              <div className="detail-meta-item">
                <span className="detail-label">Destination URL</span>
                <a
                  href={link.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-value auth-link"
                >
                  {link.originalUrl}
                </a>
              </div>

              <div className="detail-meta-item">
                <span className="detail-label">Short Code / Alias</span>
                <span className="detail-value" style={{ fontFamily: "var(--font-mono)" }}>
                  {link.shortCode}
                </span>
              </div>

              <div className="detail-meta-item">
                <span className="detail-label">Created</span>
                <span className="detail-value">
                  {new Date(link.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>

              {link.expiresAt && (
                <div className="detail-meta-item">
                  <span className="detail-label">Expiration</span>
                  <span
                    className="detail-value"
                    style={{ color: isExpired ? "#fbbf24" : "var(--color-text)" }}
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
          </section>

          {/* Click Trend Chart */}
          <section className="detail-card" aria-labelledby="click-trend-heading">
            <div className="panel-header">
              <div>
                <h2 id="click-trend-heading" className="detail-card-title">
                  Click Trend (Recent Active Days)
                </h2>
                <p className="detail-card-sub">
                  Daily recorded redirects across up to the last 14 active dates
                </p>
              </div>
              {recentHistory.length > 0 && (
                <span className="detail-card-sub" style={{ fontFamily: "var(--font-mono)" }}>
                  Peak: {maxTrend} click{maxTrend !== 1 ? "s" : ""}/day
                </span>
              )}
            </div>

            {recentHistory.length > 0 ? (
              <div className="analytics-chart-frame">
                <div className="analytics-chart-area">
                  {recentHistory.map((item) => {
                    const barHeight = Math.max(
                      8,
                      Math.round((item.count / maxTrend) * 124)
                    );
                    return (
                      <div
                        key={item.date}
                        className="analytics-bar-col"
                        title={`${item.date}: ${item.count} click${
                          item.count !== 1 ? "s" : ""
                        }`}
                      >
                        <span className="analytics-bar-count">{item.count}</span>
                        <div
                          className="analytics-bar-fill"
                          style={{ height: `${barHeight}px` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="analytics-chart-axis">
                  <span>{recentHistory[0]?.date}</span>
                  {recentHistory.length > 2 && (
                    <span>
                      {recentHistory[Math.floor(recentHistory.length / 2)]?.date}
                    </span>
                  )}
                  <span>{recentHistory[recentHistory.length - 1]?.date}</span>
                </div>
              </div>
            ) : (
              <div className="empty-state-box">
                <span>
                  No click history recorded yet. Share your short link to begin
                  tracking redirects.
                </span>
              </div>
            )}
          </section>

          {/* Top Referrers */}
          <section className="detail-card" aria-labelledby="referrers-heading">
            <div className="panel-header">
              <div>
                <h2 id="referrers-heading" className="detail-card-title">
                  Top Referrers
                </h2>
                <p className="detail-card-sub">
                  Traffic sources derived from request referrer headers
                </p>
              </div>
            </div>

            {analytics.topReferrers && analytics.topReferrers.length > 0 ? (
              <div className="metric-bar-list">
                {analytics.topReferrers.map((ref) => {
                  const pct = Math.round((ref.count / totalClicksDenominator) * 100);
                  return (
                    <div key={ref.referrer} className="metric-bar-item">
                      <div className="metric-bar-row">
                        <span className="metric-bar-name">{ref.referrer}</span>
                        <span className="metric-bar-stats">
                          {ref.count} {ref.count === 1 ? "click" : "clicks"} ({pct}%)
                        </span>
                      </div>
                      <div className="metric-bar-track">
                        <div
                          className="metric-bar-fill"
                          style={{ width: `${Math.max(3, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="detail-card-sub">
                No referrer information yet. Referrers will appear as visitors arrive.
              </p>
            )}
          </section>

          {/* Devices and Browsers */}
          <div className="analytics-two-col">
            <section className="detail-card" aria-labelledby="devices-heading">
              <div className="panel-header">
                <h2 id="devices-heading" className="detail-card-title">
                  Device Breakdown
                </h2>
              </div>

              {analytics.devices && analytics.devices.length > 0 ? (
                <div className="metric-bar-list">
                  {analytics.devices.map((d) => {
                    const pct = Math.round((d.count / totalClicksDenominator) * 100);
                    return (
                      <div key={d.device} className="metric-bar-item">
                        <div className="metric-bar-row">
                          <span className="metric-bar-name" style={{ textTransform: "capitalize" }}>
                            {d.device}
                          </span>
                          <span className="metric-bar-stats">
                            {d.count} ({pct}%)
                          </span>
                        </div>
                        <div className="metric-bar-track">
                          <div
                            className="metric-bar-fill"
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="detail-card-sub">No device data available.</p>
              )}
            </section>

            <section className="detail-card" aria-labelledby="browsers-heading">
              <div className="panel-header">
                <h2 id="browsers-heading" className="detail-card-title">
                  Browser Breakdown
                </h2>
              </div>

              {analytics.browsers && analytics.browsers.length > 0 ? (
                <div className="metric-bar-list">
                  {analytics.browsers.map((b) => {
                    const pct = Math.round((b.count / totalClicksDenominator) * 100);
                    return (
                      <div key={b.browser} className="metric-bar-item">
                        <div className="metric-bar-row">
                          <span className="metric-bar-name">{b.browser}</span>
                          <span className="metric-bar-stats">
                            {b.count} ({pct}%)
                          </span>
                        </div>
                        <div className="metric-bar-track">
                          <div
                            className="metric-bar-fill metric-bar-fill--cyan"
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="detail-card-sub">No browser data available.</p>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
