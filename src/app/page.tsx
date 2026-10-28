import Link from "next/link";

export default function Home() {
  return (
    <main className="placeholder-page">
      <div className="placeholder-card">
        <div className="placeholder-logo">⚡</div>
        <h1>LinkPulse</h1>
        <p className="placeholder-tagline">Smart URL Shortener &amp; Analytics</p>
        <div className="placeholder-badge">Phase 0 — Foundation</div>
        <p className="placeholder-description">
          The Next.js foundation is running. Application features will be built
          phase by phase.
        </p>
        <div className="placeholder-stack">
          <span>Next.js 16</span>
          <span>TypeScript</span>
          <span>App Router</span>
        </div>
        <div className="placeholder-stack" style={{ marginTop: "var(--space-4)" }}>
          <Link href="/login" className="auth-link" style={{ fontSize: "var(--text-sm)" }}>Log In</Link>
          <span style={{ color: "var(--color-border)" }}>•</span>
          <Link href="/register" className="auth-link" style={{ fontSize: "var(--text-sm)" }}>Register</Link>
          <span style={{ color: "var(--color-border)" }}>•</span>
          <Link href="/dashboard" className="auth-link" style={{ fontSize: "var(--text-sm)" }}>Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
