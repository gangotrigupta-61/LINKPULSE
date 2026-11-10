import Link from "next/link";
import { signOut } from "@/lib/auth";
import { BrandLogo } from "@/components/brand-logo";

interface NavUser {
  name?: string | null;
  email?: string | null;
}

interface AppNavbarProps {
  user?: NavUser | null;
  activePage?: "home" | "dashboard" | "analytics" | "edit";
  analyticsHref?: string;
}

export function AppNavbar({
  user,
  activePage = "home",
  analyticsHref,
}: AppNavbarProps) {
  const isAuthenticated = Boolean(user);
  const displayName = user?.name?.trim() || user?.email?.trim() || "Account";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="app-navbar">
      <div className="container app-navbar-inner">
        <div className="app-navbar-left">
          <BrandLogo href="/" />

          {isAuthenticated && activePage !== "home" && (
            <nav className="app-nav-tabs" aria-label="Workspace navigation">
              <Link
                href="/dashboard"
                className={`app-nav-tab ${
                  activePage === "dashboard" ? "is-active" : ""
                }`}
              >
                Dashboard
              </Link>
              {(activePage === "analytics" || activePage === "edit") &&
                analyticsHref && (
                  <Link
                    href={analyticsHref}
                    className={`app-nav-tab ${
                      activePage === "analytics" ? "is-active" : ""
                    }`}
                  >
                    Analytics
                  </Link>
                )}
            </nav>
          )}
        </div>

        <div className="app-navbar-right">
          {!isAuthenticated ? (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Log In
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          ) : activePage === "home" ? (
            <>
              <Link href="/dashboard" className="btn btn-primary btn-sm">
                Dashboard
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  id="logout-btn"
                  type="submit"
                  className="btn btn-ghost btn-sm"
                >
                  Log Out
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="app-user-badge" title={user?.email ?? displayName}>
                <span className="app-user-avatar" aria-hidden="true">
                  {initial}
                </span>
                <span className="app-user-label">{displayName}</span>
              </div>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  id="logout-btn"
                  type="submit"
                  className="btn btn-secondary btn-sm"
                >
                  Log Out
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

