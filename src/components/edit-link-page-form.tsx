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

  // Track if alias was modified
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
      setError("Alias can only contain letters, numbers, hyphens (-), and underscores (_).");
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
          Changes saved successfully! Redirecting to link details…
        </div>
      )}

      {/* Destination URL */}
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
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          The URL that visitors will be redirected to. Must start with http:// or https://.
        </span>
      </div>

      {/* Title */}
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

      {/* Custom Alias */}
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
            ⚠️ <strong>Warning:</strong> Changing the short code changes your public short URL.
            Any previous links shared with <code>/{initialLink.shortCode}</code> will stop working.
          </div>
        )}
      </div>

      {/* Expiry Date */}
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
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          After this timestamp, visitors will see an expired link page.
        </span>
      </div>

      {/* Active status */}
      <div
        className="form-group"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: "var(--space-3)",
          padding: "var(--space-3)",
          background: "var(--color-surface-2)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
        }}
      >
        <input
          id="edit-active"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          disabled={saving}
          style={{ width: "18px", height: "18px", accentColor: "var(--color-accent)" }}
        />
        <label htmlFor="edit-active" className="form-label" style={{ margin: 0, cursor: "pointer" }}>
          Link is Active
          <span
            style={{
              display: "block",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              fontWeight: "normal",
            }}
          >
            Uncheck to disable redirection without deleting the link.
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
        <Link
          href={`/links/${initialLink.id}`}
          className="form-button"
          style={{
            flex: 1,
            background: "transparent",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
            textDecoration: "none",
            textAlign: "center",
          }}
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="form-button"
          disabled={saving}
          style={{ flex: 2 }}
        >
          {saving ? "Saving Changes…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

