import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateLinkSchema } from "@/validators/link.validators";
import {
  getLinkById,
  updateLink,
  deleteLink,
} from "@/services/link-management.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/links/[id] — get a single link (owner only)
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

    const existing = await prisma.link.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Link not found." }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to access this link." },
        { status: 403 }
      );
    }

    const link = await getLinkById(id, session.user.id);
    if (!link) {
      return NextResponse.json({ error: "Link not found." }, { status: 404 });
    }

    return NextResponse.json(link);
  } catch (err) {
    console.error("[GET /api/links/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// PATCH /api/links/[id] — update destination URL / title / active state / expiry (owner only)
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const parsed = updateLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const { id } = await params;

    const existing = await prisma.link.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Link not found." }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to modify this link." },
        { status: 403 }
      );
    }

    const d = parsed.data;
    const destUrl = d.originalUrl || d.url;

    const updated = await updateLink(id, session.user.id, {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
      ...(destUrl !== undefined ? { originalUrl: destUrl } : {}),
      ...(d.expiresAt !== undefined
        ? {
            expiresAt:
              d.expiresAt == null || d.expiresAt === ""
                ? null
                : new Date(d.expiresAt),
          }
        : {}),
    });

    if (!updated) {
      return NextResponse.json({ error: "Link not found." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/links/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// DELETE /api/links/[id] — delete a link (owner only)
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await prisma.link.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Link not found." }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete this link." },
        { status: 403 }
      );
    }

    const deleted = await deleteLink(id, session.user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Link not found." }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/links/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
