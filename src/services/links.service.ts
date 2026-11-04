import { prisma } from "@/lib/prisma";
import { generateShortCode } from "@/lib/nanoid";
import { getBaseUrl } from "@/lib/base-url";

export class AliasConflictError extends Error {
  constructor(message = "This alias is already taken.") {
    super(message);
    this.name = "AliasConflictError";
  }
}

export interface CreateLinkParams {
  userId: string;
  url: string;
  alias?: string | null;
  title?: string | null;
  expiresAt?: string | Date | null;
}

export interface SafeLinkResponse {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  title: string | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Service to create a new short link for an authenticated user.
 */
export async function createLink(
  params: CreateLinkParams
): Promise<SafeLinkResponse> {
  let shortCode: string;

  if (params.alias && params.alias.trim()) {
    const rawAlias = params.alias.trim();

    // Case-insensitive check in DB
    const existing = await prisma.link.findFirst({
      where: {
        shortCode: {
          equals: rawAlias,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      throw new AliasConflictError("This alias is already taken.");
    }

    shortCode = rawAlias;
  } else {
    // Generate unique short code with collision retries
    let uniqueCode: string | null = null;
    const MAX_RETRIES = 5;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const candidate = generateShortCode();
      const existing = await prisma.link.findFirst({
        where: {
          shortCode: {
            equals: candidate,
            mode: "insensitive",
          },
        },
      });

      if (!existing) {
        uniqueCode = candidate;
        break;
      }
    }

    if (!uniqueCode) {
      throw new Error(
        "Unable to generate a unique short code after multiple attempts. Please try again."
      );
    }

    shortCode = uniqueCode;
  }

  // Parse expiry if present
  let expiryDate: Date | null = null;
  if (params.expiresAt) {
    expiryDate = new Date(params.expiresAt);
  }

  // Create link in database scoped to authenticated user
  const link = await prisma.link.create({
    data: {
      shortCode,
      originalUrl: params.url.trim(),
      userId: params.userId,
      title: params.title?.trim() || null,
      expiresAt: expiryDate,
      isActive: true,
    },
    select: {
      id: true,
      shortCode: true,
      originalUrl: true,
      title: true,
      expiresAt: true,
      isActive: true,
      createdAt: true,
    },
  });

  const baseUrl = getBaseUrl();

  return {
    id: link.id,
    shortCode: link.shortCode,
    shortUrl: `${baseUrl}/${link.shortCode}`,
    originalUrl: link.originalUrl,
    title: link.title,
    expiresAt: link.expiresAt,
    isActive: link.isActive,
    createdAt: link.createdAt,
  };
}
