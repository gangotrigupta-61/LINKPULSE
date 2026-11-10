"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

export interface LinkItem {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  title: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  clickCount: number;
  isExpired?: boolean;
}

export interface DashboardStats {
  totalLinks: number;
  totalClicks: number;
  activeLinks: number;
  loading: boolean;
}

interface ClickHistory {
  date: string;
  count: number;
}

interface ReferrerData {
  referrer: string;
  count: number;
}

interface AnalyticsData {
  totalClicks: number;
  lastClickAt: string | null;
  clickHistory: ClickHistory[];
  shortUrl: string;
  originalUrl: string;
  title: string | null;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
  topReferrers?: ReferrerData[];
  devices?: { device: string; count: number }[];
  browsers?: { browser: string; count: number }[];
  referrers?: ReferrerData[];
}

type StatusFilter = "all" | "active" | "inactive" | "expired";

const PAGE_SIZE = 8;

// Helper to ensure short URLs match the current browser origin in client components
function formatLinkItem(item: LinkItem): LinkItem {
  if (typeof window !== "undefined" && window.location?.origin && item.shortCode) {
    return {
      ...item,
      shortUrl: `${window.location.origin}/${item.shortCode}`,
    };
  }
  return item;
}

// ─── Tiny inline bar chart (no external deps) ────────────────────────────────
function MiniBarChart({ data }: { data: ClickHistory[] }) {
  if (data.length === 0) {
    return (
      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
        No click data recorded yet.
      </p>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const last14 = data.slice(-14);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "64px" }}>
        {last14.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.count} click${d.count !== 1 ? "s" : ""}`}
            style={{
              flex: 1,
              height: `${Math.max(4, (d.count / max) * 64)}px`,
              background: "var(--color-accent)",
              borderRadius: "3px 3px 1px 1px",
              opacity: 0.85,
              minWidth: "4px",
            }}
          />
        ))}
      </div>
      <div className="analytics-chart-axis">
        <span>{last14[0]?.date}</span>
        <span>{last14[last14.length - 1]?.date}</span>
      </div>
    </div>
  );
}

// ─── Edit Link modal ──────────────────────────────────────────────────────────
function EditLinkModal({
  link,
  onClose,
  onSaved,
}: {
  link: LinkItem;
  onClose: () => void;
  onSaved: (updated: LinkItem) => void;
}) {
  const [originalUrl, setOriginalUrl] = useState(link.originalUrl);
  const [title, setTitle] = useState(link.title || "");
  const [alias, setAlias] = useState(link.shortCode);
  const [expiresAt, setExpiresAt] = useState(
    link.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aliasChanged = alias.trim() !== link.shortCode;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUrl = originalUrl.trim();
    if (!trimmedUrl) {
      setError("Destination URL is required.");
      return;
    }

    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setError("URL must be a valid address starting with http:// or https://");
      return;
    }

    const trimmedAlias = alias.trim();
    if (trimmedAlias && trimmedAlias.length < 3) {
      setError("Custom alias must be at least 3 characters.");
      return;
    }

    if (trimmedAlias && !/^[a-zA-Z0-9_-]+$/.test(trimmedAlias)) {
      setError(
        "Custom alias can only contain letters, numbers, hyphens (-), and underscores (_)"
      );
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        originalUrl: trimmedUrl,
        title: title.trim() || null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      if (aliasChanged && trimmedAlias) {
        payload.alias = trimmedAlias;
      }

      const res = await fetch(`/api/links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update link.");
        setSaving(false);
        return;
      }

      onSaved(data as LinkItem);
      onClose();
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
        <div className="modal-header">
          <h3 id="edit-modal-title" className="modal-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Link
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close edit modal"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="auth-alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="edit-modal-alias" className="form-label">
              Short Code / Custom Alias
            </label>
            <input
              id="edit-modal-alias"
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="form-input"
              disabled={saving}
              style={{ fontFamily: "var(--font-mono)" }}
            />
            {aliasChanged && (
              <div className="alias-warning" role="alert" style={{ marginTop: "6px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>
                  Changing the alias alters your public short URL. Previously shared links with{" "}
                  <code>/{link.shortCode}</code> will stop working.
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="edit-dest-url" className="form-label">
              Destination URL *
            </label>
            <input
              id="edit-dest-url"
              type="url"
              required
              className="form-input"
              placeholder="https://example.com/new-destination"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-title" className="form-label">
              Title (optional)
            </label>
            <input
              id="edit-title"
              type="text"
              className="form-input"
              placeholder="Link title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-expiry" className="form-label">
              Expiration Date (optional, clear to remove)
            </label>
            <input
              id="edit-expiry"
              type="datetime-local"
              className="form-input"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={saving}
            />
          </div>

          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              id="save-edit-link-btn"
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ flex: 2 }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Analytics modal (Quick View) ─────────────────────────────────────────────
function AnalyticsModal({
  linkId,
  onClose,
}: {
  linkId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/links/${linkId}/analytics`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) {
          setError(json.error);
        } else {
          const analyticsObj = json as AnalyticsData;
          if (
            typeof window !== "undefined" &&
            window.location?.origin &&
            json.shortCode
          ) {
            analyticsObj.shortUrl = `${window.location.origin}/${json.shortCode}`;
          }
          setData(analyticsObj);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load analytics.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [linkId]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="quick-analytics-title">
        <div className="modal-header">
          <h3 id="quick-analytics-title" className="modal-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Link Analytics
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close analytics"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {loading && (
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
            Loading analytics...
          </p>
        )}

        {error && (
          <div className="auth-alert-error" role="alert">
            {error}
          </div>
        )}

        {data && !loading && (
          <>
            <div
              style={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-4)",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                fontSize: "var(--text-xs)",
              }}
            >
              {data.title && (
                <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)" }}>
                  {data.title}
                </div>
              )}
              <div>
                <span style={{ color: "var(--color-text-muted)" }}>Short URL: </span>
                <a
                  href={data.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="auth-link"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {data.shortUrl}
                </a>
              </div>
              <div style={{ wordBreak: "break-all", color: "var(--color-text-muted)" }}>
                <span>Destination: </span>
                <span style={{ color: "var(--color-text)" }}>{data.originalUrl}</span>
              </div>
              <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", paddingTop: "4px" }}>
                <span className={`status-badge ${data.isActive ? "status-badge--active" : "status-badge--inactive"}`}>
                  <span className="status-dot" aria-hidden="true" />
                  {data.isActive ? "Active" : "Inactive"}
                </span>
                <span style={{ color: "var(--color-text-muted)", alignSelf: "center" }}>
                  Created {new Date(data.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
              <div className="kpi-card" style={{ padding: "var(--space-4)" }}>
                <span className="kpi-label">Total Clicks</span>
                <span className="kpi-value kpi-value--accent" style={{ fontSize: "var(--text-2xl)" }}>
                  {data.totalClicks}
                </span>
              </div>
              <div className="kpi-card" style={{ padding: "var(--space-4)" }}>
                <span className="kpi-label">Latest Click</span>
                <span className="kpi-value" style={{ fontSize: "var(--text-lg)" }}>
                  {data.lastClickAt
                    ? new Date(data.lastClickAt).toLocaleDateString()
                    : "None yet"}
                </span>
              </div>
            </div>

            <div
              style={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-4)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
            >
              <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-semibold)", color: "var(--color-text-muted)" }}>
                Click Trend (Recent Days)
              </div>
              <MiniBarChart data={data.clickHistory} />
            </div>

            {data.topReferrers && data.topReferrers.length > 0 && (
              <div
                style={{
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-4)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-semibold)", color: "var(--color-text-muted)" }}>
                  Top Referrers
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {data.topReferrers.slice(0, 5).map((r) => (
                    <div
                      key={r.referrer}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "var(--text-xs)",
                        padding: "6px 10px",
                        background: "var(--color-surface)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <span style={{ fontFamily: "var(--font-mono)" }}>{r.referrer}</span>
                      <span style={{ color: "var(--color-text)", fontWeight: "var(--font-semibold)" }}>
                        {r.count} {r.count === 1 ? "click" : "clicks"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "var(--space-1)" }}>
              <Link href={`/links/${linkId}`} className="btn btn-primary btn-sm">
                Open Full Analytics
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Single link row card ─────────────────────────────────────────────────────
function LinkCard({
  link,
  onToggleActive,
  onDelete,
  onAnalytics,
  onEdit,
}: {
  link: LinkItem;
  onToggleActive: (id: string, current: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAnalytics: (id: string) => void;
  onEdit: (link: LinkItem) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isExpired = !!link.isExpired;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  async function handleToggle() {
    setToggling(true);
    try {
      await onToggleActive(link.id, link.isActive);
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setDeleting(true);
    await onDelete(link.id);
  }

  return (
    <article
      className={`link-row-card ${!link.isActive || isExpired ? "is-muted" : ""}`}
    >
      <div className="link-row-top">
        <div className="link-row-identity">
          {link.title && (
            <div className="link-row-title-line">
              <span className="link-row-title" title={link.title}>
                {link.title}
              </span>
            </div>
          )}

          <div className="link-row-short-wrap">
            <a
              href={link.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-row-short-url"
            >
              {link.shortUrl}
            </a>
          </div>

          <div className="link-row-dest" title={link.originalUrl}>
            {link.originalUrl}
          </div>
        </div>

        <div className="link-row-right-meta">
          <span className="link-clicks-pill">
            {link.clickCount} click{link.clickCount !== 1 ? "s" : ""}
          </span>

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
      </div>

      <div className="link-row-footer">
        <div className="link-row-dates">
          <span>
            Created{" "}
            {new Date(link.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {link.expiresAt && (
            <span>
              Expires{" "}
              {new Date(link.expiresAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        <div className="link-row-actions">
          <button
            type="button"
            onClick={handleCopy}
            className={`action-btn ${copied ? "action-btn--copied" : ""}`}
            title="Copy short URL"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {copied ? (
                <polyline points="20 6 9 17 4 12" />
              ) : (
                <>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </>
              )}
            </svg>
            {copied ? "Copied" : "Copy"}
          </button>

          <Link
            href={`/links/${link.id}`}
            className="action-btn action-btn--accent"
            title="View full analytics page"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Analytics
          </Link>

          <button
            type="button"
            onClick={() => onAnalytics(link.id)}
            className="action-btn"
            title="Quick analytics summary modal"
          >
            Quick View
          </button>

          <button
            type="button"
            onClick={() => onEdit(link)}
            className="action-btn"
            title="Edit link"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={handleToggle}
            disabled={toggling}
            className="action-btn"
            title={link.isActive ? "Disable link" : "Enable link"}
          >
            {toggling ? "Updating..." : link.isActive ? "Disable" : "Enable"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={`action-btn action-btn--danger ${
              confirmDelete ? "action-btn--danger-active" : ""
            }`}
            title={
              confirmDelete ? "Click again to confirm deletion" : "Delete link"
            }
          >
            {deleting ? "Deleting..." : confirmDelete ? "Confirm Delete" : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── My Links section (main export) ──────────────────────────────────────────
interface MyLinksSectionProps {
  refreshSignal?: number;
  hideStats?: boolean;
  onStatsUpdate?: (stats: DashboardStats) => void;
}

export function MyLinksSection({
  refreshSignal = 0,
  hideStats = false,
  onStatsUpdate,
}: MyLinksSectionProps = {}) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsLinkId, setAnalyticsLinkId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  // Search, Filter & Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/links");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load links.");
      } else {
        setLinks((json as LinkItem[]).map(formatLinkItem));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch("/api/links")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) {
          if (Array.isArray(json)) {
            setLinks((json as LinkItem[]).map(formatLinkItem));
            setError(null);
          } else {
            setError(json.error ?? "Failed to load links.");
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Network error. Please try again.");
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [refreshSignal]);

  // Listen to global link creation events when rendered standalone
  useEffect(() => {
    const handleLinksUpdated = () => {
      void fetchLinks();
    };
    window.addEventListener("linkpulse:links-updated", handleLinksUpdated);
    return () => {
      window.removeEventListener("linkpulse:links-updated", handleLinksUpdated);
    };
  }, [fetchLinks]);

  async function handleToggleActive(id: string, currentActive: boolean) {
    try {
      const res = await fetch(`/api/links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        setLinks((prev) =>
          prev.map((l) => (l.id === id ? { ...l, isActive: !currentActive } : l))
        );
      }
    } catch {
      // silent
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
      if (res.status === 204 || res.ok) {
        setLinks((prev) => prev.filter((l) => l.id !== id));
      }
    } catch {
      // silent
    }
  }

  function handleLinkSaved(updated: LinkItem) {
    const formatted = formatLinkItem(updated);
    setLinks((prev) =>
      prev.map((l) => (l.id === formatted.id ? { ...l, ...formatted } : l))
    );
  }

  // Aggregate summary statistics
  const totalLinks = links.length;
  const totalClicks = useMemo(
    () => links.reduce((sum, l) => sum + (l.clickCount || 0), 0),
    [links]
  );
  const activeLinks = useMemo(
    () => links.filter((l) => l.isActive && !l.isExpired).length,
    [links]
  );
  const inactiveLinks = useMemo(
    () => links.filter((l) => !l.isActive).length,
    [links]
  );
  const expiredLinks = useMemo(
    () => links.filter((l) => !!l.isExpired).length,
    [links]
  );

  useEffect(() => {
    onStatsUpdate?.({ totalLinks, totalClicks, activeLinks, loading });
  }, [totalLinks, totalClicks, activeLinks, loading, onStatsUpdate]);

  // Filtered links
  const filteredLinks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return links.filter((link) => {
      if (statusFilter === "active" && (!link.isActive || link.isExpired)) {
        return false;
      }
      if (statusFilter === "inactive" && link.isActive) {
        return false;
      }
      if (statusFilter === "expired" && !link.isExpired) {
        return false;
      }

      if (!query) return true;

      return (
        (link.title && link.title.toLowerCase().includes(query)) ||
        link.shortCode.toLowerCase().includes(query) ||
        link.shortUrl.toLowerCase().includes(query) ||
        link.originalUrl.toLowerCase().includes(query)
      );
    });
  }, [links, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedLinks = filteredLinks.slice(startIndex, startIndex + PAGE_SIZE);

  const filterTabs: { id: StatusFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: totalLinks },
    { id: "active", label: "Active", count: activeLinks },
    { id: "inactive", label: "Inactive", count: inactiveLinks },
    { id: "expired", label: "Expired", count: expiredLinks },
  ];

  return (
    <section id="my-links" className="panel-card" aria-labelledby="my-links-heading">
      {!hideStats && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-card-top">
              <span className="kpi-label">Total Links</span>
            </div>
            <div className="kpi-value kpi-value--accent">
              {loading ? "—" : totalLinks}
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-top">
              <span className="kpi-label">Active Links</span>
            </div>
            <div className="kpi-value kpi-value--success">
              {loading ? "—" : activeLinks}
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-top">
              <span className="kpi-label">Total Clicks</span>
            </div>
            <div className="kpi-value kpi-value--cyan">
              {loading ? "—" : totalClicks}
            </div>
          </div>
        </div>
      )}

      <div className="panel-header">
        <div>
          <h2 id="my-links-heading" className="panel-title">
            Your Links
          </h2>
          <p className="panel-subtitle">
            Search, filter, copy, edit, or open detailed analytics for any short link.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchLinks()}
          className="btn btn-secondary btn-sm"
          title="Refresh links"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="links-toolbar">
        <div className="links-search-wrap">
          <span className="links-search-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            id="links-search-input"
            type="search"
            className="links-search-input"
            placeholder="Search by title, alias, or destination URL..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Search links"
          />
          {searchQuery && (
            <button
              type="button"
              className="links-search-clear"
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              aria-label="Clear search"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="links-filter-group" role="tablist" aria-label="Filter links by status">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={statusFilter === tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`links-filter-tab ${
                statusFilter === tab.id ? "is-active" : ""
              }`}
            >
              <span>{tab.label}</span>
              <span className="links-filter-count">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="links-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-row">
              Loading links...
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="auth-alert-error" role="alert">
          {error}
          <button
            type="button"
            onClick={() => void fetchLinks()}
            style={{
              marginLeft: "var(--space-2)",
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: "inherit",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && links.length === 0 && (
        <div className="empty-state-box">
          <strong>No short links created yet</strong>
          <span>Use the Create Short Link form above to shorten your first URL.</span>
        </div>
      )}

      {!loading && !error && links.length > 0 && filteredLinks.length === 0 && (
        <div className="empty-state-box">
          <strong>No links match your current search or filter</strong>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {!loading && !error && paginatedLinks.length > 0 && (
        <>
          <div className="links-list">
            {paginatedLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                onToggleActive={handleToggleActive}
                onDelete={handleDelete}
                onAnalytics={(id) => setAnalyticsLinkId(id)}
                onEdit={(l) => setEditingLink(l)}
              />
            ))}
          </div>

          {filteredLinks.length > PAGE_SIZE && (
            <div className="pagination-bar">
              <span className="pagination-info">
                Showing {startIndex + 1}–
                {Math.min(startIndex + PAGE_SIZE, filteredLinks.length)} of{" "}
                {filteredLinks.length} links
              </span>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="page-btn"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`page-btn ${
                        pageNum === safePage ? "is-active" : ""
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                      aria-current={pageNum === safePage ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  )
                )}
                <button
                  type="button"
                  className="page-btn"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {analyticsLinkId && (
        <AnalyticsModal
          linkId={analyticsLinkId}
          onClose={() => setAnalyticsLinkId(null)}
        />
      )}

      {editingLink && (
        <EditLinkModal
          link={editingLink}
          onClose={() => setEditingLink(null)}
          onSaved={handleLinkSaved}
        />
      )}
    </section>
  );
}
