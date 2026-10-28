import { prisma } from "@/lib/prisma";
import { isReservedWord } from "@/lib/reserved-words";

export type LinkStatus = "ok" | "not_found" | "inactive" | "expired";

export interface ResolvedLink {
  status: LinkStatus;
  originalUrl?: string;
  linkId?: string;
}

/**
 * Resolve a shortCode to its destination URL, checking status and expiry.
 * Returns the originalUrl only when status === "ok".
 * Automatically rejects reserved words to protect system routes.
 */
export async function resolveShortCode(
  shortCode: string
): Promise<ResolvedLink> {
  const normalized = (shortCode || "").trim();
  if (!normalized || isReservedWord(normalized)) {
    return { status: "not_found" };
  }

  const link = await prisma.link.findFirst({
    where: {
      shortCode: {
        equals: normalized,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      originalUrl: true,
      isActive: true,
      expiresAt: true,
    },
  });

  if (!link) {
    return { status: "not_found" };
  }

  if (!link.isActive) {
    return { status: "inactive" };
  }

  if (link.expiresAt && link.expiresAt.getTime() <= Date.now()) {
    return { status: "expired" };
  }

  return {
    status: "ok",
    originalUrl: link.originalUrl,
    linkId: link.id,
  };
}

