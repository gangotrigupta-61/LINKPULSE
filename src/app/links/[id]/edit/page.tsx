import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getLinkById } from "@/services/link-management.service";
import { AppNavbar } from "@/components/app-navbar";
import { EditLinkPageForm } from "@/components/edit-link-page-form";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return { title: "Edit Link | LinkPulse" };
  }
  const link = await getLinkById(id, session.user.id);
  return {
    title: link
      ? `Edit ${link.title || link.shortCode} | LinkPulse`
      : "Edit Link | LinkPulse",
  };
}

export default async function EditLinkPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/links/${id}/edit`)}`);
  }

  const link = await getLinkById(id, session.user.id);
  if (!link) {
    notFound();
  }

  return (
    <>
      <AppNavbar
        user={session.user}
        activePage="edit"
        analyticsHref={`/links/${link.id}`}
      />
      <main className="workspace-page">
        <div className="edit-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <Link href={`/links/${link.id}`} className="detail-back-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Link Analytics
            </Link>
            <Link href="/dashboard" className="detail-back-link">
              Dashboard
            </Link>
          </div>

          <div className="detail-card">
            <div className="auth-header">
              <h1 className="workspace-title" style={{ fontSize: "var(--text-xl)" }}>
                Edit Short Link
              </h1>
              <p className="workspace-subtitle">
                Update the destination URL, alias, title, or expiration for{" "}
                <code style={{ color: "#9b95ff", fontFamily: "var(--font-mono)" }}>
                  /{link.shortCode}
                </code>
              </p>
            </div>

            <EditLinkPageForm initialLink={link} />
          </div>
        </div>
      </main>
    </>
  );
}
