import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import { CreateLinkForm } from "@/components/create-link-form";
import { MyLinksSection } from "@/components/my-links-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | LinkPulse",
  description: "Manage your links and view analytics on your LinkPulse dashboard.",
};

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="auth-page">
      <div className="auth-card" style={{ maxWidth: "680px" }}>
        <div className="auth-header">
          <span className="placeholder-badge">Protected Area</span>
          <h1 className="auth-title">Dashboard</h1>
          <p className="auth-subtitle">
            Authenticated session verified successfully.
          </p>
        </div>

        <div
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-xs)",
          }}
        >
          <div>
            <strong style={{ color: "var(--color-text-muted)" }}>User ID:</strong>{" "}
            <span id="session-user-id">{session?.user?.id ?? "N/A"}</span>
          </div>
          <div>
            <strong style={{ color: "var(--color-text-muted)" }}>Email:</strong>{" "}
            <span id="session-user-email">{session?.user?.email ?? "N/A"}</span>
          </div>
          <div>
            <strong style={{ color: "var(--color-text-muted)" }}>Name:</strong>{" "}
            <span id="session-user-name">{session?.user?.name ?? "Not provided"}</span>
          </div>
        </div>

        {/* Phase 3: Link Creation Interface */}
        <CreateLinkForm />

        {/* Phase 4/5: My Links list + analytics */}
        <MyLinksSection />

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            id="logout-btn"
            type="submit"
            className="form-button"
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            Log Out
          </button>
        </form>

        <div className="auth-footer">
          <Link href="/" className="auth-link">
            ← Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
