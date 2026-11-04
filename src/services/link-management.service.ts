import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/base-url";

export interface SafeLink {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  title: string | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  clickCount: number;
  isExpired: boolean;
}

/**
 * List all links belonging to the authenticated user, ordered newest-first.
 * Includes aggregated click count per link (no N+1).
 */
export async function getUserLinks(userId: string): Promise<SafeLink[]> {
  const links = await prisma.link.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      shortCode: true,
      originalUrl: true,
      title: true,
      expiresAt: true,
      isActive: true,
      createdAt: true,
      _count: { select: { clicks: true } },
    },
  });

  const baseUrl = getBaseUrl();

  const now = Date.now();

  return links.map((l) => ({
    id: l.id,
    shortCode: l.shortCode,
    shortUrl: `${baseUrl}/${l.shortCode}`,
    originalUrl: l.originalUrl,
    title: l.title,
    expiresAt: l.expiresAt,
    isActive: l.isActive,
    createdAt: l.createdAt,
    clickCount: l._count.clicks,
    isExpired: l.expiresAt != null && l.expiresAt.getTime() <= now,
  }));
}

/**
 * Get a single link by id, verifying ownership.
 * Returns null if not found or wrong owner.
 */
export async function getLinkById(
  linkId: string,
  userId: string
): Promise<SafeLink | null> {
  const link = await prisma.link.findFirst({
    where: { id: linkId, userId },
    select: {
      id: true,
      shortCode: true,
      originalUrl: true,
      title: true,
      expiresAt: true,
      isActive: true,
      createdAt: true,
      _count: { select: { clicks: true } },
    },
  });

  if (!link) return null;

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
    clickCount: link._count.clicks,
    isExpired: link.expiresAt != null && link.expiresAt.getTime() <= Date.now(),
  };
}

export interface UpdateLinkParams {
  title?: string | null;
  isActive?: boolean;
  expiresAt?: Date | null;
  originalUrl?: string;
  alias?: string;
}

/**
 * Update editable fields on a link the user owns.
 * Returns updated link or null if not found / not owned.
 */
export async function updateLink(
  linkId: string,
  userId: string,
  params: UpdateLinkParams
): Promise<SafeLink | null> {
  // Verify ownership first
  const existing = await prisma.link.findFirst({
    where: { id: linkId, userId },
    select: { id: true },
  });
  if (!existing) return null;

  const updated = await prisma.link.update({
    where: { id: linkId },
    data: {
      ...(params.title !== undefined ? { title: params.title } : {}),
      ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params.expiresAt !== undefined
        ? { expiresAt: params.expiresAt }
        : {}),
      ...(params.originalUrl !== undefined
        ? { originalUrl: params.originalUrl }
        : {}),
      ...(params.alias !== undefined && params.alias !== ""
        ? { shortCode: params.alias }
        : {}),
    },
    select: {
      id: true,
      shortCode: true,
      originalUrl: true,
      title: true,
      expiresAt: true,
      isActive: true,
      createdAt: true,
      _count: { select: { clicks: true } },
    },
  });

  const baseUrl = getBaseUrl();

  return {
    id: updated.id,
    shortCode: updated.shortCode,
    shortUrl: `${baseUrl}/${updated.shortCode}`,
    originalUrl: updated.originalUrl,
    title: updated.title,
    expiresAt: updated.expiresAt,
    isActive: updated.isActive,
    createdAt: updated.createdAt,
    clickCount: updated._count.clicks,
    isExpired: updated.expiresAt != null && updated.expiresAt.getTime() <= Date.now(),
  };
}

/**
 * Delete a link the user owns.
 * Returns true on success, false if not found / not owned.
 */
export async function deleteLink(
  linkId: string,
  userId: string
): Promise<boolean> {
  const existing = await prisma.link.findFirst({
    where: { id: linkId, userId },
    select: { id: true },
  });
  if (!existing) return false;

  await prisma.link.delete({ where: { id: linkId } });
  return true;
}
