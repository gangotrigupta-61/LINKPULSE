"use client";

import React, { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function CopyButton({
  text,
  label = "Copy URL",
  copiedLabel = "✓ Copied!",
  className = "form-button",
  style,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is not available
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Ignore
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={className}
      style={{
        width: "auto",
        padding: "var(--space-2) var(--space-4)",
        fontSize: "var(--text-xs)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text)",
        cursor: "pointer",
        borderRadius: "var(--radius-md)",
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        transition: "all var(--transition-fast)",
        ...style,
      }}
      title="Copy to clipboard"
    >
      {copied ? (
        <span style={{ color: "var(--color-success)" }}>{copiedLabel}</span>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}

