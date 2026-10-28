import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { resolveShortCode } from "@/services/redirect.service";
import { recordClick } from "@/services/analytics.service";
import { parseUserAgent } from "@/lib/ua-parser";

interface ShortCodePageProps {
  params: Promise<{ shortCode: string }>;
}

export default async function ShortCodePage({ params }: ShortCodePageProps) {
  const { shortCode } = await params;
  const result = await resolveShortCode(shortCode);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "inactive") {
    return <LinkStatusPage status="inactive" />;
  }

  if (result.status === "expired") {
    return <LinkStatusPage status="expired" />;
  }

  // Record click asynchronously — do NOT await so redirect stays fast.
  // If this fails, it is caught inside recordClick and logged server-side.
  if (result.linkId) {
    const headerList = await headers();
    const referer = headerList.get("referer");
    const ua = headerList.get("user-agent");
    const { deviceType, browser } = parseUserAgent(ua);

    void recordClick(result.linkId, {
      referrer: referer,
      deviceType,
      browser,
    });
  }

  redirect(result.originalUrl!);
}

function LinkStatusPage({ status }: { status: "inactive" | "expired" }) {
  const isExpired = status === "expired";

  return (
    <main className="placeholder-page">
      <div className="placeholder-card">
        <div className="placeholder-logo">{isExpired ? "⏰" : "🚫"}</div>
        <h1 style={{ fontSize: "var(--text-2xl)" }}>
          {isExpired ? "Link Expired" : "Link Disabled"}
        </h1>
        <p className="placeholder-description">
          {isExpired
            ? "This short link has expired and is no longer available."
            : "This short link has been disabled by its owner."}
        </p>
        <Link
          href="/"
          className="auth-link"
          style={{ marginTop: "var(--space-4)", fontSize: "var(--text-sm)" }}
        >
          ← Return to LinkPulse
        </Link>
      </div>
    </main>
  );
}
