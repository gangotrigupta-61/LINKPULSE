"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface LinkItem {
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

// ─── Tiny inline bar chart (no external deps) ────────────────────────────────
function MiniBarChart({ data }: { data: ClickHistory[] }) {
  if (data.length === 0) return <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>No click data yet.</p>;

  const max = Math.max(...data.map((d) => d.count), 1);
  const last14 = data.slice(-14);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "48px" }}>
      {last14.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${d.count} click${d.count !== 1 ? "s" : ""}`}
          style={{
            flex: 1,
            height: `${Math.max(4, (d.count / max) * 48)}px`,
            background: "var(--color-accent)",
            borderRadius: "2px",
            opacity: 0.8,
            minWidth: "4px",
          }}
        />
      ))}
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
      setError("Custom alias can only contain letters, numbers, hyphens (-), and underscores (_)");
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
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "var(--space-4)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-6)",
          width: "100%",
          maxWidth: "500px",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)" }}>
            ✏️ Edit Link
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              fontSize: "var(--text-lg)",
              padding: "var(--space-1)",
            }}
            aria-label="Close edit modal"
          >
            ✕
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
              style={{
                fontFamily: "var(--font-mono)",
              }}
            />
            {aliasChanged && (
              <div className="alias-warning" role="alert" style={{ marginTop: "var(--space-2)" }}>
                ⚠️ <strong>Warning:</strong> Changing the alias changes the public URL. Existing links will break.
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
              className="form-button"
              style={{
                background: "transparent",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            >
              Cancel
            </button>
            <button
              id="save-edit-link-btn"
              type="submit"
              disabled={saving}
              className="form-button"
            >
              {saving ? "Saving Changes…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Analytics modal ─────────────────────────────────────────────────────────
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
          setData(json as AnalyticsData);
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
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "var(--space-4)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-6)",
          width: "100%",
          maxWidth: "520px",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
          boxShadow: "var(--shadow-lg)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)" }}>
            📊 Link Analytics
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              fontSize: "var(--text-lg)",
              lineHeight: 1,
              padding: "var(--space-1)",
            }}
            aria-label="Close analytics"
          >
            ✕
          </button>
        </div>

        {loading && (
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
            Loading analytics…
          </p>
        )}

        {error && (
          <div className="auth-alert-error" role="alert">
            {error}
          </div>
        )}

        {data && !loading && (
          <>
            {/* Link info */}
            <div
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-4)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
                fontSize: "var(--text-sm)",
              }}
            >
              {data.title && (
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>Title: </span>
                  <strong>{data.title}</strong>
                </div>
              )}
              <div>
                <span style={{ color: "var(--color-text-muted)" }}>Short URL: </span>
                <a
                  href={data.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="auth-link"
                >
                  {data.shortUrl}
                </a>
              </div>
              <div style={{ wordBreak: "break-all" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Destination: </span>
                {data.originalUrl}
              </div>
              <div>
                <span style={{ color: "var(--color-text-muted)" }}>Status: </span>
                <span
                  style={{
                    color: data.isActive
                      ? "var(--color-success)"
                      : "var(--color-error)",
                    fontWeight: "var(--font-semibold)",
                  }}
                >
                  {data.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--color-text-muted)" }}>Created: </span>
                {new Date(data.createdAt).toLocaleString()}
              </div>
              {data.expiresAt && (
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>Expires: </span>
                  {new Date(data.expiresAt).toLocaleString()}
                </div>
              )}
            </div>

            {/* Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-3)",
              }}
            >
              <div
                style={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-4)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "var(--text-3xl)",
                    fontWeight: "var(--font-bold)",
                    color: "var(--color-accent)",
                  }}
                >
                  {data.totalClicks}
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  Total Clicks
                </div>
              </div>
              <div
                style={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-4)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-semibold)",
                    color: "var(--color-text)",
                    wordBreak: "break-word",
                  }}
                >
                  {data.lastClickAt
                    ? new Date(data.lastClickAt).toLocaleDateString()
                    : "—"}
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  Last Click
                </div>
              </div>
            </div>

            {/* Chart */}
            <div
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-4)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)" }}>
                Click Trend (last 14 days)
              </div>
              <MiniBarChart data={data.clickHistory} />
            </div>

            {/* Top Referrers */}
            {data.topReferrers && data.topReferrers.length > 0 && (
              <div
                style={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-4)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)" }}>
                  Top Referrers
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  {data.topReferrers.slice(0, 5).map((r) => (
                    <div
                      key={r.referrer}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "var(--text-xs)",
                        padding: "var(--space-1) var(--space-2)",
                        background: "var(--color-surface)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <span style={{ fontFamily: "var(--font-mono)" }}>{r.referrer}</span>
                      <span style={{ color: "var(--color-accent)", fontWeight: "var(--font-semibold)" }}>
                        {r.count} {r.count === 1 ? "click" : "clicks"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Devices & Browsers */}
            {data.devices && data.devices.length > 0 && (
              <div
                style={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-4)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)" }}>
                  Devices &amp; Browsers
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                  {data.devices.map((d) => (
                    <span
                      key={d.device}
                      style={{
                        padding: "2px 8px",
                        background: "rgba(108,99,255,0.12)",
                        border: "1px solid rgba(108,99,255,0.3)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "var(--text-xs)",
                        color: "var(--color-accent)",
                      }}
                    >
                      {d.device}: {d.count}
                    </span>
                  ))}
                  {data.browsers?.map((b) => (
                    <span
                      key={b.browser}
                      style={{
                        padding: "2px 8px",
                        background: "rgba(0,217,255,0.12)",
                        border: "1px solid rgba(0,217,255,0.3)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "var(--text-xs)",
                        color: "var(--color-accent-2)",
                      }}
                    >
                      {b.browser}: {b.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Single link card ─────────────────────────────────────────────────────────
function LinkCard({
  link,
  onToggleActive,
  onDelete,
  onAnalytics,
  onEdit,
}: {
  link: LinkItem;
  onToggleActive: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
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
    onToggleActive(link.id, link.isActive);
    setToggling(false);
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setDeleting(true);
    onDelete(link.id);
  }

  return (
    <div
      style={{
        background: "var(--color-surface-2)",
        border: `1px solid ${link.isActive && !isExpired ? "var(--color-border)" : "rgba(239,68,68,0.25)"}`,
        borderRadius: "var(--radius-md)",
        padding: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        opacity: link.isActive && !isExpired ? 1 : 0.75,
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
          {link.title && (
            <div
              style={{
                fontWeight: "var(--font-semibold)",
                fontSize: "var(--text-sm)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "280px",
              }}
            >
              {link.title}
            </div>
          )}
          <a
            href={link.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="auth-link"
            style={{
              fontSize: "var(--text-sm)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {link.shortUrl}
          </a>
        </div>

        {/* Status badges */}
        <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
          {isExpired && (
            <span
              style={{
                padding: "2px 8px",
                background: "rgba(245,158,11,0.15)",
                border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-xs)",
                color: "var(--color-warning)",
                whiteSpace: "nowrap",
              }}
            >
              Expired
            </span>
          )}
          <span
            style={{
              padding: "2px 8px",
              background: link.isActive
                ? "rgba(34,197,94,0.12)"
                : "rgba(239,68,68,0.12)",
              border: `1px solid ${link.isActive ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-xs)",
              color: link.isActive ? "var(--color-success)" : "var(--color-error)",
              whiteSpace: "nowrap",
            }}
          >
            {link.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Destination */}
      <div
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-text-muted)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={link.originalUrl}
      >
        → {link.originalUrl}
      </div>

      {/* Meta row */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-4)",
          fontSize: "var(--text-xs)",
          color: "var(--color-text-muted)",
          flexWrap: "wrap",
        }}
      >
        <span>Created {new Date(link.createdAt).toLocaleDateString()}</span>
        {link.expiresAt && (
          <span>
            Expires {new Date(link.expiresAt).toLocaleDateString()}
          </span>
        )}
        <span
          style={{
            color: link.clickCount > 0 ? "var(--color-accent)" : "var(--color-text-muted)",
            fontWeight: link.clickCount > 0 ? "var(--font-semibold)" : "var(--font-normal)",
          }}
        >
          {link.clickCount} click{link.clickCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={handleCopy}
          className="form-button"
          style={{
            width: "auto",
            padding: "var(--space-2) var(--space-3)",
            fontSize: "var(--text-xs)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
          title="Copy short URL"
        >
          {copied ? "✓ Copied!" : "Copy URL"}
        </button>

        <button
          onClick={() => onEdit(link)}
          className="form-button"
          style={{
            width: "auto",
            padding: "var(--space-2) var(--space-3)",
            fontSize: "var(--text-xs)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
          title="Quick edit modal"
        >
          ✏️ Edit
        </button>

        <Link
          href={`/links/${link.id}`}
          className="form-button"
          style={{
            width: "auto",
            padding: "var(--space-2) var(--space-3)",
            fontSize: "var(--text-xs)",
            background: "rgba(108, 99, 255, 0.15)",
            border: "1px solid rgba(108, 99, 255, 0.35)",
            color: "var(--color-accent)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
          title="View full dedicated analytics"
        >
          📊 Full Analytics
        </Link>

        <button
          onClick={() => onAnalytics(link.id)}
          className="form-button"
          style={{
            width: "auto",
            padding: "var(--space-2) var(--space-3)",
            fontSize: "var(--text-xs)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
          title="Quick analytics popup"
        >
          Quick View
        </button>

        <button
          onClick={handleToggle}
          disabled={toggling}
          className="form-button"
          style={{
            width: "auto",
            padding: "var(--space-2) var(--space-3)",
            fontSize: "var(--text-xs)",
            background: link.isActive
              ? "rgba(239,68,68,0.12)"
              : "rgba(34,197,94,0.12)",
            border: `1px solid ${link.isActive ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
            color: link.isActive ? "var(--color-error)" : "var(--color-success)",
          }}
          title={link.isActive ? "Deactivate link" : "Activate link"}
        >
          {link.isActive ? "Deactivate" : "Activate"}
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="form-button"
          style={{
            width: "auto",
            padding: "var(--space-2) var(--space-3)",
            fontSize: "var(--text-xs)",
            background: confirmDelete
              ? "rgba(239,68,68,0.25)"
              : "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "var(--color-error)",
          }}
          title={confirmDelete ? "Click again to confirm deletion" : "Delete link"}
        >
          {deleting ? "Deleting…" : confirmDelete ? "Confirm Delete" : "Delete"}
        </button>
      </div>
    </div>
  );
}

// ─── My Links section (main export) ──────────────────────────────────────────
export function MyLinksSection() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsLinkId, setAnalyticsLinkId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/links");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load links.");
      } else {
        setLinks(json as LinkItem[]);
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
            setLinks(json as LinkItem[]);
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
  }, []);

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
    setLinks((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)));
  }

  // Aggregate summary statistics
  const totalLinks = links.length;
  const totalClicks = links.reduce((sum, l) => sum + (l.clickCount || 0), 0);
  const activeLinks = links.filter((l) => l.isActive && !l.isExpired).length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        marginTop: "var(--space-6)",
      }}
    >
      {/* Summary statistics bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--space-3)",
        }}
      >
        <div
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-bold)", color: "var(--color-accent)" }}>
            {loading ? "…" : totalLinks}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Total Links
          </div>
        </div>

        <div
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-bold)", color: "var(--color-accent-2)" }}>
            {loading ? "…" : totalClicks}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Total Clicks
          </div>
        </div>

        <div
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-bold)", color: "var(--color-success)" }}>
            {loading ? "…" : activeLinks}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Active Links
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)" }}>
          My Links
        </h2>
        <button
          onClick={() => void fetchLinks()}
          style={{
            background: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            fontSize: "var(--text-xs)",
            padding: "var(--space-1) var(--space-3)",
          }}
          title="Refresh links"
        >
          ↻ Refresh
        </button>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: "100px",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-text-muted)",
                fontSize: "var(--text-xs)",
              }}
            >
              Loading short link…
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="auth-alert-error" role="alert">
          {error}
          <button
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
        <div
          style={{
            textAlign: "center",
            color: "var(--color-text-muted)",
            fontSize: "var(--text-sm)",
            padding: "var(--space-8)",
            background: "var(--color-surface-2)",
            border: "1px dashed var(--color-border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          You haven&apos;t created any short links yet.
          <br />
          Use the form above to create your first one!
        </div>
      )}

      {!loading && !error && links.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {links.map((link) => (
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
    </div>
  );
}
