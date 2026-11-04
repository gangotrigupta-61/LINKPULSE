import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LinkPulse — Smart URL Shortener & Analytics",
  description:
    "Create short links and track every click with detailed analytics. Device breakdown, referrers, click history — all in one dashboard.",
};

export default function HomePage() {
  return (
    <main className="landing-page">
      {/* ── Navigation ───────────────────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="container landing-nav-inner">
          <span className="landing-brand">
            <span className="landing-brand-icon">⚡</span>
            LinkPulse
          </span>
          <div className="landing-nav-links">
            <Link href="/login" className="landing-nav-link">
              Log In
            </Link>
            <Link href="/register" className="landing-cta-btn landing-cta-btn--small">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="container landing-hero-inner">
          <div className="landing-badge">🚀 Fast · Secure · Analytics-first</div>
          <h1 className="landing-headline">
            Short links with{" "}
            <span className="landing-gradient-text">real-time analytics</span>
          </h1>
          <p className="landing-tagline">
            Create smart short URLs, track every click, and understand your
            audience — all from a beautiful dashboard.
          </p>
          <div className="landing-hero-cta">
            <Link href="/register" className="landing-cta-btn">
              Create Free Account
            </Link>
            <Link href="/login" className="landing-ghost-btn">
              Sign In →
            </Link>
          </div>
          {/* Demo pill */}
          <div className="landing-demo-pill">
            <code>linkpulse.app/<span className="landing-demo-code">my-link</span></code>
            <span className="landing-demo-arrow">→</span>
            <code className="landing-demo-dest">your-long-url.com/with/path</code>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="landing-features">
        <div className="container">
          <h2 className="landing-section-title">Everything you need</h2>
          <p className="landing-section-sub">
            Built for creators, marketers, and developers who care about their links.
          </p>
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-icon">⚡</div>
              <h3>Instant Short Links</h3>
              <p>
                Shorten any URL in seconds. Auto-generate a unique code or pick
                a custom alias that matches your brand.
              </p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">📊</div>
              <h3>Real-time Analytics</h3>
              <p>
                Track every click with timestamps, referrers, device types, and
                browser breakdowns — updated instantly.
              </p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">✏️</div>
              <h3>Custom Aliases</h3>
              <p>
                Choose memorable, branded short codes. Update your destination
                URL any time without changing the short link.
              </p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">🔒</div>
              <h3>Link Management</h3>
              <p>
                Activate, deactivate, set expiry dates, and manage all your
                links from a single dashboard.
              </p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">🌍</div>
              <h3>Top Referrers</h3>
              <p>
                See exactly where your traffic comes from — Twitter, LinkedIn,
                email newsletters, or direct visits.
              </p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">🛡️</div>
              <h3>Secure by Default</h3>
              <p>
                Only http/https destinations. Rate limiting, reserved-word
                protection, and owner-only access controls built in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="landing-how">
        <div className="container">
          <h2 className="landing-section-title">How it works</h2>
          <div className="landing-steps">
            <div className="landing-step">
              <div className="landing-step-num">1</div>
              <h3>Create your account</h3>
              <p>Sign up for free in seconds. No credit card required.</p>
            </div>
            <div className="landing-step-connector" aria-hidden="true">→</div>
            <div className="landing-step">
              <div className="landing-step-num">2</div>
              <h3>Paste your long URL</h3>
              <p>
                Enter any http/https URL and optionally add a custom alias or
                expiry date.
              </p>
            </div>
            <div className="landing-step-connector" aria-hidden="true">→</div>
            <div className="landing-step">
              <div className="landing-step-num">3</div>
              <h3>Share &amp; track</h3>
              <p>
                Share your short link anywhere. Watch the analytics roll in with
                every click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────── */}
      <section className="landing-cta-section">
        <div className="container landing-cta-inner">
          <h2>Ready to get started?</h2>
          <p>Join LinkPulse for free — no credit card required.</p>
          <Link href="/register" className="landing-cta-btn landing-cta-btn--large">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="container landing-footer-inner">
          <span className="landing-brand landing-brand--footer">
            <span className="landing-brand-icon">⚡</span>
            LinkPulse
          </span>
          <div className="landing-footer-links">
            <Link href="/login" className="landing-footer-link">Log In</Link>
            <Link href="/register" className="landing-footer-link">Register</Link>
            <Link href="/dashboard" className="landing-footer-link">Dashboard</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
