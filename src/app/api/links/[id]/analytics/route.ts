import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLinkById } from "@/services/link-management.service";
import { getLinkAnalytics } from "@/services/analytics.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/links/[id]/analytics — analytics for a link (owner only)
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify ownership — getLinkById returns null if wrong user
    const link = await getLinkById(id, session.user.id);
    if (!link) {
      return NextResponse.json({ error: "Link not found." }, { status: 404 });
    }

    const analytics = await getLinkAnalytics(id);

    return NextResponse.json({
      linkId: id,
      shortCode: link.shortCode,
      shortUrl: link.shortUrl,
      originalUrl: link.originalUrl,
      title: link.title,
      isActive: link.isActive,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      totalClicks: analytics.totalClicks,
      lastClickAt: analytics.lastClickAt,
      clickHistory: analytics.clickHistory,
      devices: analytics.devices,
      browsers: analytics.browsers,
      referrers: analytics.referrers,
    });
  } catch (err) {
    console.error("[GET /api/links/[id]/analytics]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

