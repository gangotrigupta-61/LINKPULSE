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
    <main className="status-page">
      <div className="status-card">
        <div className="status-icon-circle" aria-hidden="true">
          {isExpired ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          )}
        </div>
        <h1>{isExpired ? "Link Expired" : "Link Disabled"}</h1>
        <p className="status-description">
          {isExpired
            ? "This short link has passed its expiration date and is no longer available."
            : "This short link has been disabled by its owner."}
        </p>
        <Link href="/" className="btn btn-secondary btn-sm">
          Return to LinkPulse
        </Link>
      </div>
    </main>
  );
}
