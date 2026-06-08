import { and, eq, inArray } from "drizzle-orm";
import { communityMedia, getDb } from "@/db";
import {
  COMMUNITY_IMAGE_MAX_BYTES,
  COMMUNITY_IMAGE_MIMES,
} from "@/lib/community/config";

export async function createCommunityImageMedia(args: {
  ownerId: string;
  dataUrl: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ ok: true; id: string; url: string } | { ok: false; error: string }> {
  if (args.sizeBytes > COMMUNITY_IMAGE_MAX_BYTES) {
    return { ok: false, error: "community_image_too_large" };
  }
  if (
    !COMMUNITY_IMAGE_MIMES.includes(
      args.mimeType as (typeof COMMUNITY_IMAGE_MIMES)[number],
    )
  ) {
    return { ok: false, error: "community_image_invalid_mime" };
  }
  if (!args.dataUrl.startsWith("data:image/")) {
    return { ok: false, error: "community_image_invalid" };
  }

  const db = getDb();
  const [row] = await db
    .insert(communityMedia)
    .values({
      ownerId: args.ownerId,
      bucket: "inline",
      objectKey: `posts/${args.ownerId}/${Date.now()}`,
      publicUrl: args.dataUrl,
      fileType: "image",
      mimeType: args.mimeType,
      sizeBytes: args.sizeBytes,
      status: "ready",
      variants: { thumb: args.dataUrl, medium: args.dataUrl },
    })
    .returning({ id: communityMedia.id, publicUrl: communityMedia.publicUrl });

  if (!row) return { ok: false, error: "community_media_failed" };
  return { ok: true, id: row.id, url: row.publicUrl };
}

export async function getMediaUrls(
  ids: string[] | null | undefined,
): Promise<{ id: string; url: string; variants: Record<string, string> | null }[]> {
  if (!ids?.length) return [];
  const db = getDb();
  const rows = await db
    .select({
      id: communityMedia.id,
      publicUrl: communityMedia.publicUrl,
      variants: communityMedia.variants,
    })
    .from(communityMedia)
    .where(
      and(eq(communityMedia.status, "ready"), inArray(communityMedia.id, ids)),
    );

  return rows.map((r) => ({
      id: r.id,
      url: r.publicUrl,
      variants: r.variants,
    }));
}

export async function assertOwnedMedia(
  ownerId: string,
  mediaIds: string[],
): Promise<boolean> {
  if (!mediaIds.length) return true;
  const db = getDb();
  const rows = await db
    .select({ id: communityMedia.id })
    .from(communityMedia)
    .where(and(eq(communityMedia.ownerId, ownerId)));
  const owned = new Set(rows.map((r) => r.id));
  return mediaIds.every((id) => owned.has(id));
}
