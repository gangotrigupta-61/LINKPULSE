"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SafeLink } from "@/services/link-management.service";

interface EditLinkPageFormProps {
  initialLink: SafeLink;
}

export function EditLinkPageForm({ initialLink }: EditLinkPageFormProps) {
  const router = useRouter();

  const [destinationUrl, setDestinationUrl] = useState(initialLink.originalUrl);
  const [title, setTitle] = useState(initialLink.title || "");
  const [alias, setAlias] = useState(initialLink.shortCode);
  const [isActive, setIsActive] = useState(initialLink.isActive);
  const [expiresAt, setExpiresAt] = useState(
    initialLink.expiresAt
      ? new Date(initialLink.expiresAt).toISOString().slice(0, 16)
      : ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const aliasChanged = alias.trim() !== initialLink.shortCode;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmedUrl = destinationUrl.trim();
    if (!trimmedUrl) {
      setError("Destination URL is required.");
      return;
    }

    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setError("Destination URL must begin with http:// or https://");
      return;
    }

    const trimmedAlias = alias.trim();
    if (trimmedAlias && trimmedAlias.length < 3) {
      setError("Custom alias must be at least 3 characters.");
      return;
    }

    if (trimmedAlias && !/^[a-zA-Z0-9_-]+$/.test(trimmedAlias)) {
      setError(
        "Alias can only contain letters, numbers, hyphens (-), and underscores (_)."
      );
      return;
    }

    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        originalUrl: trimmedUrl,
        title: title.trim() || null,
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      if (aliasChanged && trimmedAlias) {
        payload.alias = trimmedAlias;
      }

      const res = await fetch(`/api/links/${initialLink.id}`, {
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

      setSuccess(true);
      setTimeout(() => {
        router.push(`/links/${initialLink.id}`);
        router.refresh();
      }, 1000);
    } catch {
      setError("A network error occurred. Please try again.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form" noValidate>
      {error && (
        <div className="auth-alert-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="auth-alert-success" role="status">
          Changes saved successfully. Redirecting to link analytics...
        </div>
      )}

      <div className="form-group">
        <label htmlFor="edit-url" className="form-label">
          Destination URL *
        </label>
        <input
          id="edit-url"
          type="url"
          required
          className="form-input"
          placeholder="https://example.com/my-destination"
          value={destinationUrl}
          onChange={(e) => setDestinationUrl(e.target.value)}
          disabled={saving}
        />
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-dim)" }}>
          Visitors will be redirected to this http:// or https:// address.
        </span>
      </div>

      <div className="form-group">
        <label htmlFor="edit-title" className="form-label">
          Link Title (optional)
        </label>
        <input
          id="edit-title"
          type="text"
          className="form-input"
          placeholder="e.g. Portfolio Website"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
          maxLength={100}
        />
      </div>

      <div className="form-group">
        <label htmlFor="edit-alias" className="form-label">
          Short Code / Custom Alias
        </label>
        <input
          id="edit-alias"
          type="text"
          className="form-input"
          placeholder="my-custom-slug"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          disabled={saving}
          style={{ fontFamily: "var(--font-mono)" }}
        />
        {aliasChanged && (
          <div className="alias-warning" role="alert">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              <strong>Warning:</strong> Changing the short code changes your public short URL.
              Previous links shared with <code>/{initialLink.shortCode}</code> will stop working.
            </span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="edit-expires" className="form-label">
          Expiration Date (optional, clear to remove)
        </label>
        <input
          id="edit-expires"
          type="datetime-local"
          className="form-input"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          disabled={saving}
        />
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-dim)" }}>
          After this timestamp, visitors will see an expired link notice.
        </span>
      </div>

      <div className="toggle-checkbox-card">
        <input
          id="edit-active"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          disabled={saving}
          style={{ width: "17px", height: "17px", marginTop: "2px", accentColor: "var(--color-accent)" }}
        />
        <label
          htmlFor="edit-active"
          style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "2px" }}
        >
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", color: "var(--color-text)" }}>
            Link is Active
          </span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            Uncheck to pause redirection without deleting the link or its analytics.
          </span>
        </label>
      </div>

      <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
        <Link
          href={`/links/${initialLink.id}`}
          className="btn btn-secondary"
          style={{ flex: 1 }}
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
          style={{ flex: 2 }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
