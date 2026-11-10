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

interface CreateLinkFormProps {
  onLinkCreated?: () => void;
}

export function CreateLinkForm({ onLinkCreated }: CreateLinkFormProps = {}) {
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
        errors.alias =
          "Alias can only contain letters, numbers, hyphens, and underscores.";
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

      // Notify dashboard & sibling link list
      onLinkCreated?.();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("linkpulse:links-updated"));
      }
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
    <section id="create-link-section" className="panel-card" aria-labelledby="create-link-heading">
      <div className="panel-header">
        <div>
          <h2 id="create-link-heading" className="panel-title">
            Create Short Link
          </h2>
          <p className="panel-subtitle">
            Shorten any http/https destination and optionally add a custom alias or expiration.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="auth-alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {createdLink && (
        <div className="created-banner" role="status">
          <div className="created-banner-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Short link created</span>
          </div>

          <div className="created-banner-row">
            <input
              type="text"
              readOnly
              value={createdLink.shortUrl}
              aria-label="Generated short URL"
              className="form-input created-banner-input"
            />
            <button
              id="copy-short-url-btn"
              type="button"
              onClick={handleCopy}
              className={`btn btn-sm ${copied ? "action-btn--copied" : "btn-secondary"}`}
              style={{ height: "40px", paddingInline: "16px" }}
            >
              {copied ? "Copied" : "Copy URL"}
            </button>
          </div>

          <div className="created-banner-meta">
            Destination: {createdLink.originalUrl}
            {createdLink.expiresAt && (
              <> &middot; Expires {new Date(createdLink.expiresAt).toLocaleString()}</>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-link-form" noValidate>
        <div className="create-link-primary-row">
          <div className="create-link-url-wrap">
            <label htmlFor="destination-url" className="form-label">
              Destination URL *
            </label>
            <input
              id="destination-url"
              type="url"
              className={`form-input create-link-url-input ${
                fieldErrors.url ? "has-error" : ""
              }`}
              placeholder="https://example.com/your-long-destination-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              required
            />
            {fieldErrors.url && (
              <span className="form-error">{fieldErrors.url}</span>
            )}
          </div>

          <button
            id="create-link-submit-btn"
            type="submit"
            className="btn btn-primary create-link-submit-btn"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Short Link"}
          </button>
        </div>

        <div className="create-link-options-grid">
          <div className="form-group">
            <label htmlFor="link-title" className="form-label">
              Title (optional)
            </label>
            <input
              id="link-title"
              type="text"
              className="form-input"
              placeholder="e.g. Launch Announcement"
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
              placeholder="e.g. summer-launch"
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
        </div>
      </form>
    </section>
  );
}
