import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getLinkById } from "@/services/link-management.service";
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
    title: link ? `Edit ${link.title || link.shortCode} | LinkPulse` : "Edit Link | LinkPulse",
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
    <main className="edit-page">
      <div className="edit-container">
        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href={`/links/${link.id}`} className="detail-back-link">
            ← Back to Link Analytics
          </Link>
          <Link href="/dashboard" className="detail-back-link">
            Dashboard
          </Link>
        </div>

        {/* Card */}
        <div className="detail-card">
          <div className="auth-header" style={{ textAlign: "left" }}>
            <span className="placeholder-badge" style={{ alignSelf: "flex-start" }}>
              Link Settings
            </span>
            <h1 className="auth-title" style={{ fontSize: "var(--text-xl)" }}>
              Edit Short Link
            </h1>
            <p className="auth-subtitle">
              Update the destination URL, alias, title, or expiration for{" "}
              <code style={{ color: "var(--color-accent)" }}>{link.shortCode}</code>
            </p>
          </div>

          <EditLinkPageForm initialLink={link} />
        </div>
      </div>
    </main>
  );
}

