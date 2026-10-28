import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
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

const updateSchema = z.object({
  title: z.string().trim().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => {
        if (val == null || val === "") return true;
        const d = new Date(val);
        return !isNaN(d.getTime());
      },
      { message: "expiresAt must be a valid date string or null" }
    ),
});

// PATCH /api/links/[id] — update title / active state / expiry (owner only)
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

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const { id } = await params;
    const d = parsed.data;

    const updated = await updateLink(id, session.user.id, {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
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

