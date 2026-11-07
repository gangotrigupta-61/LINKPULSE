"use client";

import React, { useState } from "react";

interface CreatedLinkData {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  title: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export function CreateLinkForm() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [alias, setAlias] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<CreatedLinkData | null>(null);
  const [copied, setCopied] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    url?: string;
    alias?: string;
    expiresAt?: string;
  }>({});

  const validate = () => {
    const errors: { url?: string; alias?: string; expiresAt?: string } = {};

    if (!url.trim()) {
      errors.url = "Destination URL is required.";
    } else if (!/^https?:\/\//i.test(url.trim())) {
      errors.url = "URL must start with http:// or https://";
    }

    if (alias.trim()) {
      if (alias.trim().length < 3 || alias.trim().length > 50) {
        errors.alias = "Alias must be between 3 and 50 characters.";
      } else if (!/^[a-zA-Z0-9_-]+$/.test(alias.trim())) {
        errors.alias = "Alias can only contain letters, numbers, hyphens, and underscores.";
      }
    }

    if (expiresAt) {
      const selected = new Date(expiresAt).getTime();
      if (isNaN(selected) || selected <= Date.now()) {
        errors.expiresAt = "Expiry date must be in the future.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setCopied(false);

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const payload: {
        url: string;
        title?: string;
        alias?: string;
        expiresAt?: string;
      } = {
        url: url.trim(),
      };

      if (title.trim()) payload.title = title.trim();
      if (alias.trim()) payload.alias = alias.trim();
      if (expiresAt) payload.expiresAt = new Date(expiresAt).toISOString();

      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to create short link.");
        setLoading(false);
        return;
      }

      const currentOrigin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "";
      const safeShortUrl =
        currentOrigin && data.shortCode
          ? `${currentOrigin}/${data.shortCode}`
          : data.shortUrl;

      setCreatedLink({
        ...data,
        shortUrl: safeShortUrl,
      });
      // Reset form on success
      setUrl("");
      setTitle("");
      setAlias("");
      setExpiresAt("");
      setFieldErrors({});
    } catch {
      setErrorMessage("Network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdLink) return;
    try {
      await navigator.clipboard.writeText(createdLink.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        marginTop: "var(--space-4)",
      }}
    >
      <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)" }}>
        Create Short Link
      </h2>

      {errorMessage && (
        <div className="auth-alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {createdLink && (
        <div
          className="auth-alert-success"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          <div style={{ fontWeight: "var(--font-semibold)" }}>
            🎉 Short link created successfully!
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              readOnly
              value={createdLink.shortUrl}
              className="form-input"
              style={{
                flex: "1 1 200px",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-sm)",
                background: "var(--color-surface)",
              }}
            />
            <button
              id="copy-short-url-btn"
              type="button"
              onClick={handleCopy}
              className="form-button"
              style={{
                width: "auto",
                padding: "var(--space-2) var(--space-4)",
                fontSize: "var(--text-sm)",
              }}
            >
              {copied ? "Copied!" : "Copy URL"}
            </button>
          </div>
          <div
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              marginTop: "var(--space-1)",
            }}
          >
            Destination: {createdLink.originalUrl}
            {createdLink.expiresAt && (
              <> • Expires: {new Date(createdLink.expiresAt).toLocaleString()}</>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="form-group">
          <label htmlFor="destination-url" className="form-label">
            Destination URL *
          </label>
          <input
            id="destination-url"
            type="url"
            className={`form-input ${fieldErrors.url ? "has-error" : ""}`}
            placeholder="https://example.com/long/url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            required
          />
          {fieldErrors.url && (
            <span className="form-error">{fieldErrors.url}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="link-title" className="form-label">
            Title (optional)
          </label>
          <input
            id="link-title"
            type="text"
            className="form-input"
            placeholder="e.g. My Portfolio Project"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="custom-alias" className="form-label">
            Custom Alias (optional)
          </label>
          <input
            id="custom-alias"
            type="text"
            className={`form-input ${fieldErrors.alias ? "has-error" : ""}`}
            placeholder="e.g. my-custom-link (3-50 chars)"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            disabled={loading}
          />
          {fieldErrors.alias && (
            <span className="form-error">{fieldErrors.alias}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="link-expiry" className="form-label">
            Expiration Date (optional)
          </label>
          <input
            id="link-expiry"
            type="datetime-local"
            className={`form-input ${fieldErrors.expiresAt ? "has-error" : ""}`}
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            disabled={loading}
          />
          {fieldErrors.expiresAt && (
            <span className="form-error">{fieldErrors.expiresAt}</span>
          )}
        </div>

        <button
          id="create-link-submit-btn"
          type="submit"
          className="form-button"
          disabled={loading}
        >
          {loading ? "Creating Short Link..." : "Create Short Link"}
        </button>
      </form>
    </div>
  );
}
