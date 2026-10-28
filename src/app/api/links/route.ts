import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createLinkSchema } from "@/validators/link.validators";
import { createLink, AliasConflictError } from "@/services/links.service";
import { checkLinkCreateRateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  try {
    // 1. Verify authentication strictly server-side
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Authentication required to create short links." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Parse request JSON
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    // 3. Validate input with Zod
    const parsed = createLinkSchema.safeParse(body);
    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message || "Input validation failed.";
      return NextResponse.json(
        { error: firstError, issues: parsed.error.format() },
        { status: 400 }
      );
    }

    // 4. Check rate limiting (10 links per hour per user)
    const rateLimit = await checkLinkCreateRateLimit(userId);
    if (!rateLimit.success) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimit.reset - Date.now()) / 1000)
      );

      return NextResponse.json(
        {
          error:
            "Link creation rate limit reached. You can create up to 10 links per hour.",
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
          reset: new Date(rateLimit.reset).toISOString(),
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfterSeconds.toString(),
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": rateLimit.reset.toString(),
          },
        }
      );
    }

    // 5. Delegate to service layer
    const link = await createLink({
      userId,
      url: parsed.data.url,
      alias: parsed.data.alias || null,
      title: parsed.data.title || null,
      expiresAt: parsed.data.expiresAt || null,
    });

    return NextResponse.json(link, {
      status: 201,
      headers: {
        "X-RateLimit-Limit": rateLimit.limit.toString(),
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      },
    });
  } catch (error) {
    if (error instanceof AliasConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("[POST /api/links] Unexpected failure:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while creating link." },
      { status: 500 }
    );
  }
}
