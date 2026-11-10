import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppNavbar } from "@/components/app-navbar";
import { DashboardWorkspace } from "@/components/dashboard-workspace";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | LinkPulse",
  description:
    "Manage your links and view analytics on your LinkPulse dashboard.",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
      <AppNavbar user={session.user} activePage="dashboard" />
      <main className="workspace-page">
        <div className="workspace-container">
          <DashboardWorkspace />
        </div>
      </main>
    </>
  );
}
