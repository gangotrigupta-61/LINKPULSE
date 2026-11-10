import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { AppNavbar } from "@/components/app-navbar";
import { BrandLogo } from "@/components/brand-logo";

export const metadata: Metadata = {
  title: "LinkPulse — Smart URL Shortener & Analytics",
  description:
    "Create short links and track every click with detailed analytics. Device breakdown, referrers, click history — all in one dashboard.",
};

const FEATURES = [
  {
    title: "Instant Short Links",
    description:
      "Shorten long URLs in seconds with collision-resistant generated codes or memorable custom aliases.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    title: "Real-Time Click Telemetry",
    description:
      "Monitor click trends over time alongside device categories and browser breakdowns without slowing down redirects.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    title: "Editable Destinations & Aliases",
    description:
      "Update target URLs, titles, or custom slugs any time without losing your link history or dashboard organization.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    title: "Expiration & Status Controls",
    description:
      "Enable or disable redirects on demand and schedule future expiration timestamps for time-bound campaigns.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "Referrer Attribution",
    description:
      "See which domains and channels drive traffic to your links, with clean fallback labeling for direct visits.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    title: "Protocol & Access Safety",
    description:
      "Strict http/https URL validation, reserved-route protection, rate limiting, and owner-isolated workspace access.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

export default async function HomePage() {
  const session = await auth();
  const user = session?.user ?? null;
  const isAuthenticated = Boolean(user);

  return (
    <main className="landing-page">
      <AppNavbar user={user} activePage="home" />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="container landing-hero-grid">
          <div className="landing-hero-copy">
            <span className="landing-eyebrow">
              <span className="landing-eyebrow-dot" aria-hidden="true" />
              URL Shortener &amp; Link Analytics
            </span>

            <h1 className="landing-headline">
              Short links built for{" "}
              <span className="landing-headline-muted">
                clarity and control.
              </span>
            </h1>

            <p className="landing-tagline">
              Turn long URLs into clean, manageable short links. Configure custom
              aliases, set expirations, and inspect real-time click analytics from
              one focused workspace.
            </p>

            <div className="landing-hero-actions">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="btn btn-primary btn-lg">
                    Go to Dashboard
                  </Link>
                  {user?.email && (
                    <span className="landing-signed-note">
                      Signed in as {user.email}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Link href="/register" className="btn btn-primary btn-lg">
                    Get Started
                  </Link>
                  <Link href="/login" className="btn btn-secondary btn-lg">
                    Log In
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Workflow Specimen (static preview, zero fake metrics) */}
          <div className="landing-specimen" aria-label="Short link workflow preview">
            <div className="landing-specimen-head">
              <span>Link Configuration Preview</span>
              <span className="status-badge status-badge--active">
                <span className="status-dot" aria-hidden="true" />
                Active
              </span>
            </div>

            <div className="landing-specimen-block">
              <span className="landing-specimen-label">Destination URL</span>
              <div className="landing-specimen-box">
                https://example.com/releases/product-update?utm_campaign=launch
              </div>
            </div>

            <div className="landing-specimen-block">
              <span className="landing-specimen-label">Short Link</span>
              <div className="landing-specimen-output">
                <span className="landing-specimen-short">
                  linkpulse.app/launch-guide
                </span>
                <span className="landing-specimen-tag">Custom Alias</span>
              </div>
            </div>

            <div className="landing-specimen-tags">
              <span className="landing-specimen-tag">Timestamp History</span>
              <span className="landing-specimen-tag">Referrer Tracking</span>
              <span className="landing-specimen-tag">Device &amp; Browser</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="landing-features">
        <div className="container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">
              Everything required to manage your links
            </h2>
            <p className="landing-section-sub">
              Practical shortening, lifecycle management, and privacy-first click
              analytics without unnecessary bloat.
            </p>
          </div>

          <div className="landing-features-grid">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="landing-feature-card">
                <div className="landing-feature-icon-box">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="landing-how">
        <div className="container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">How it works</h2>
            <p className="landing-section-sub">
              Three straightforward steps from long URL to live telemetry.
            </p>
          </div>

          <div className="landing-steps-grid">
            <div className="landing-step-card">
              <span className="landing-step-index">01</span>
              <h3>Access your workspace</h3>
              <p>
                Sign in or create an account to keep all your shortened links and
                analytics isolated to your workspace.
              </p>
            </div>

            <div className="landing-step-card">
              <span className="landing-step-index">02</span>
              <h3>Create &amp; configure</h3>
              <p>
                Paste any valid http/https destination URL and optionally add a
                title, custom alias, or expiration time.
              </p>
            </div>

            <div className="landing-step-card">
              <span className="landing-step-index">03</span>
              <h3>Share &amp; inspect</h3>
              <p>
                Copy your short link with one click and review click history, top
                referrers, devices, and browsers at any time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="container landing-footer-inner">
          <div className="landing-footer-brand">
            <BrandLogo href="/" />
            <span className="landing-footer-copy">
              Smart URL Shortener &amp; Analytics
            </span>
          </div>

          <div className="landing-footer-links">
            {isAuthenticated ? (
              <Link href="/dashboard" className="landing-footer-link">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="landing-footer-link">
                  Log In
                </Link>
                <Link href="/register" className="landing-footer-link">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </main>
  );
}
