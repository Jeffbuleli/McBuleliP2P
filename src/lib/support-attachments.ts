import { and, isNotNull, lt, sql } from "drizzle-orm";
import { getDb, supportMessages, type SupportAttachment } from "@/db";

/** Images are stripped from API responses and DB after this age. */
export const SUPPORT_IMAGE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export function supportImageExpired(createdAt: Date | string): boolean {
  const t =
    typeof createdAt === "string" ? new Date(createdAt).getTime() : createdAt.getTime();
  return Date.now() - t > SUPPORT_IMAGE_RETENTION_MS;
}

export function filterAttachmentsForDisplay(
  attachments: SupportAttachment[] | null | undefined,
  createdAt: Date | string,
): { attachments: SupportAttachment[] | null; hadExpiredImages: boolean } {
  if (!attachments?.length) return { attachments: null, hadExpiredImages: false };
  if (!supportImageExpired(createdAt)) {
    return { attachments, hadExpiredImages: false };
  }
  const kept = attachments.filter((a) => a.type !== "image");
  return {
    attachments: kept.length ? kept : null,
    hadExpiredImages: attachments.some((a) => a.type === "image"),
  };
}

/** Null image blobs on messages older than retention (saves DB space). */
export async function purgeExpiredSupportAttachments(limit = 80): Promise<number> {
  try {
    const cutoff = new Date(Date.now() - SUPPORT_IMAGE_RETENTION_MS);
    const db = getDb();
    const rows = await db
      .select({ id: supportMessages.id, attachments: supportMessages.attachments })
      .from(supportMessages)
      .where(
        and(
          isNotNull(supportMessages.attachments),
          lt(supportMessages.createdAt, cutoff),
        ),
      )
      .limit(limit);

    let purged = 0;
    for (const row of rows) {
      const att = row.attachments;
      if (!att?.length) continue;
      const images = att.filter((a) => a.type === "image");
      if (!images.length) continue;
      const kept = att.filter((a) => a.type !== "image");
      await db
        .update(supportMessages)
        .set({ attachments: kept.length ? kept : null })
        .where(sql`${supportMessages.id} = ${row.id}`);
      purged += 1;
    }
    return purged;
  } catch {
    return 0;
  }
}
