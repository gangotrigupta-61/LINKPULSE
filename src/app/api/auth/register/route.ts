import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/validators/auth.validators";

// Helper to determine if an error is a transient database connection/cold-start error
function isConnectionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const errorObj = err as Record<string, unknown>;
  const code = errorObj.code as string | undefined;
  const message = (errorObj.message as string | undefined) || "";
  const name = (errorObj.name as string | undefined) || "";

  return (
    code === "P1001" ||
    code === "P1002" ||
    code === "P1008" ||
    code === "P1017" ||
    name === "PrismaClientInitializationError" ||
    message.includes("Can't reach database server") ||
    message.includes("timed out") ||
    message.includes("Connection terminated")
  );
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError =
        parseResult.error.issues[0]?.message || "Validation failed";
      return NextResponse.json(
        { error: firstError, issues: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Helper for executing database queries with 1 automatic retry on cold start
    const runQuery = async <T>(operation: () => Promise<T>): Promise<T> => {
      try {
        return await operation();
      } catch (err) {
        if (isConnectionError(err)) {
          console.warn(
            "[Register API] Database cold-start detected, retrying after 1.5s..."
          );
          await new Promise((res) => setTimeout(res, 1500));
          return await operation();
        }
        throw err;
      }
    };

    // Check email uniqueness server-side
    const existingUser = await runQuery(() =>
      prisma.user.findUnique({
        where: { email: normalizedEmail },
      })
    );

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password with bcrypt cost factor of 10
    const passwordHash = await bcrypt.hash(password, 10);

    // Store user securely
    const newUser = await runQuery(() =>
      prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name ? name.trim() : null,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      })
    );

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);

    // Specific Prisma unique constraint violation (P2002)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Connection or cold-start error that persisted past retry
    if (isConnectionError(error)) {
      return NextResponse.json(
        {
          error:
            "Database server is connecting. Please wait a moment and try again.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error occurred while registering user." },
      { status: 500 }
    );
  }
}
