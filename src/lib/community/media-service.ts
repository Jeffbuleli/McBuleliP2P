import { and, eq, inArray } from "drizzle-orm";
import { communityMedia, getDb } from "@/db";
import {
  COMMUNITY_IMAGE_MAX_BYTES,
  COMMUNITY_IMAGE_MIMES,
  COMMUNITY_VIDEO_MAX_BYTES,
  COMMUNITY_VIDEO_MIMES,
} from "@/lib/community/config";
import {
  communityMediaKey,
  communityR2Configured,
  communityR2CredentialWarnings,
  communityR2EnvPresent,
  createCommunityUploadUrl,
  putCommunityObjectToR2,
  verifyCommunityR2Object,
} from "@/lib/community/media-r2";

const INLINE_DATA_URL_MAX = 400_000;

export async function presignCommunityImageUpload(args: {
  ownerId: string;
  mimeType: string;
  sizeBytes: number;
  kind?: "posts" | "blogs" | "covers" | "avatars" | "stories";
}): Promise<
  | { ok: true; id: string; uploadUrl: string; publicUrl: string }
  | { ok: false; error: string }
> {
  if (!communityR2Configured()) {
    return { ok: false, error: "r2_not_configured" };
  }
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

  const ext =
    args.mimeType === "image/png"
      ? "png"
      : args.mimeType === "image/webp"
        ? "webp"
        : args.mimeType === "image/avif"
          ? "avif"
          : "jpg";
  const objectKey = communityMediaKey(
    args.kind ?? "posts",
    args.ownerId,
    `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`,
  );

  const signed = await createCommunityUploadUrl({
    objectKey,
    mimeType: args.mimeType,
    sizeBytes: args.sizeBytes,
  });
  if (!signed) return { ok: false, error: "r2_presign_failed" };

  const db = getDb();
  const [row] = await db
    .insert(communityMedia)
    .values({
      ownerId: args.ownerId,
      bucket: signed.bucket,
      objectKey,
      publicUrl: signed.publicUrl,
      fileType: "image",
      mimeType: args.mimeType,
      sizeBytes: args.sizeBytes,
      status: "pending",
      variants: null,
    })
    .returning({ id: communityMedia.id });

  if (!row) return { ok: false, error: "community_media_failed" };

  return {
    ok: true,
    id: row.id,
    uploadUrl: signed.uploadUrl,
    publicUrl: signed.publicUrl,
  };
}

/** Upload binaire via serveur (contourne CORS R2 sur mobile). */
export async function uploadCommunityImageBuffer(args: {
  ownerId: string;
  buffer: Uint8Array;
  mimeType: string;
  kind?: "posts" | "blogs" | "covers" | "avatars" | "stories";
}): Promise<{ ok: true; id: string; url: string } | { ok: false; error: string }> {
  if (args.buffer.length > COMMUNITY_IMAGE_MAX_BYTES) {
    return { ok: false, error: "community_image_too_large" };
  }
  if (
    !COMMUNITY_IMAGE_MIMES.includes(
      args.mimeType as (typeof COMMUNITY_IMAGE_MIMES)[number],
    )
  ) {
    return { ok: false, error: "community_image_invalid_mime" };
  }

  const ext =
    args.mimeType === "image/png"
      ? "png"
      : args.mimeType === "image/webp"
        ? "webp"
        : args.mimeType === "image/avif"
          ? "avif"
          : "jpg";
  const objectKey = communityMediaKey(
    args.kind ?? "posts",
    args.ownerId,
    `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`,
  );

  if (communityR2EnvPresent() && !communityR2Configured()) {
    const hints = communityR2CredentialWarnings();
    return {
      ok: false,
      error: hints[0] ?? "r2_credentials_invalid",
    };
  }

  let publicUrl: string;
  let bucket = "inline";

  if (communityR2Configured()) {
    const url = await putCommunityObjectToR2({
      objectKey,
      body: args.buffer,
      mimeType: args.mimeType,
    });
    if (!url) return { ok: false, error: "r2_upload_failed" };
    publicUrl = url;
    bucket = getCommunityR2ConfigBucket();
  } else if (communityR2EnvPresent()) {
    return { ok: false, error: "r2_upload_failed" };
  } else {
    const b64 = Buffer.from(args.buffer).toString("base64");
    publicUrl = `data:${args.mimeType};base64,${b64}`;
    if (publicUrl.length > INLINE_DATA_URL_MAX) {
      return { ok: false, error: "community_image_use_r2" };
    }
  }

  const db = getDb();
  const [row] = await db
    .insert(communityMedia)
    .values({
      ownerId: args.ownerId,
      bucket,
      objectKey,
      publicUrl,
      fileType: "image",
      mimeType: args.mimeType,
      sizeBytes: args.buffer.length,
      status: "ready",
      variants: { thumb: publicUrl, medium: publicUrl },
    })
    .returning({ id: communityMedia.id, publicUrl: communityMedia.publicUrl });

  if (!row) return { ok: false, error: "community_media_failed" };
  return { ok: true, id: row.id, url: row.publicUrl };
}

/** Upload vidéo via serveur → R2 (posts community). */
export async function uploadCommunityVideoBuffer(args: {
  ownerId: string;
  buffer: Uint8Array;
  mimeType: string;
  kind?: "posts" | "blogs" | "covers" | "stories";
}): Promise<{ ok: true; id: string; url: string } | { ok: false; error: string }> {
  if (args.buffer.length > COMMUNITY_VIDEO_MAX_BYTES) {
    return { ok: false, error: "community_video_too_large" };
  }
  if (
    !COMMUNITY_VIDEO_MIMES.includes(
      args.mimeType as (typeof COMMUNITY_VIDEO_MIMES)[number],
    )
  ) {
    return { ok: false, error: "community_video_invalid_mime" };
  }

  const ext = args.mimeType === "video/webm" ? "webm" : "mp4";
  const objectKey = communityMediaKey(
    args.kind ?? "posts",
    args.ownerId,
    `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`,
  );

  if (!communityR2Configured()) {
    return { ok: false, error: "r2_not_configured" };
  }

  const url = await putCommunityObjectToR2({
    objectKey,
    body: args.buffer,
    mimeType: args.mimeType,
  });
  if (!url) return { ok: false, error: "r2_upload_failed" };

  const db = getDb();
  const [row] = await db
    .insert(communityMedia)
    .values({
      ownerId: args.ownerId,
      bucket: getCommunityR2ConfigBucket(),
      objectKey,
      publicUrl: url,
      fileType: "video",
      mimeType: args.mimeType,
      sizeBytes: args.buffer.length,
      status: "ready",
      variants: null,
    })
    .returning({ id: communityMedia.id, publicUrl: communityMedia.publicUrl });

  if (!row) return { ok: false, error: "community_media_failed" };
  return { ok: true, id: row.id, url: row.publicUrl };
}

function getCommunityR2ConfigBucket(): string {
  return process.env.COMMUNITY_R2_BUCKET?.trim() || "r2";
}

export async function completeCommunityImageUpload(args: {
  ownerId: string;
  mediaId: string;
}): Promise<{ ok: true; id: string; url: string } | { ok: false; error: string }> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(communityMedia)
    .where(
      and(
        eq(communityMedia.id, args.mediaId),
        eq(communityMedia.ownerId, args.ownerId),
      ),
    )
    .limit(1);

  if (!row) return { ok: false, error: "not_found" };
  if (row.status === "ready") {
    return { ok: true, id: row.id, url: row.publicUrl };
  }

  const exists = await verifyCommunityR2Object({
    objectKey: row.objectKey,
    minSizeBytes: 1,
  });
  if (!exists) {
    return { ok: false, error: "r2_object_missing" };
  }

  await db
    .update(communityMedia)
    .set({
      status: "ready",
      variants: { thumb: row.publicUrl, medium: row.publicUrl },
    })
    .where(eq(communityMedia.id, row.id));

  return { ok: true, id: row.id, url: row.publicUrl };
}

/** Fallback inline (sans R2) — petites images uniquement. */
export async function createCommunityImageMedia(args: {
  ownerId: string;
  dataUrl: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ ok: true; id: string; url: string } | { ok: false; error: string }> {
  if (args.sizeBytes > COMMUNITY_IMAGE_MAX_BYTES) {
    return { ok: false, error: "community_image_too_large" };
  }
  if (args.dataUrl.length > INLINE_DATA_URL_MAX) {
    return { ok: false, error: "community_image_use_r2" };
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
): Promise<
  {
    id: string;
    url: string;
    variants: Record<string, string> | null;
    fileType: string;
    mimeType: string;
  }[]
> {
  if (!ids?.length) return [];
  const db = getDb();
  const rows = await db
    .select({
      id: communityMedia.id,
      publicUrl: communityMedia.publicUrl,
      variants: communityMedia.variants,
      status: communityMedia.status,
      fileType: communityMedia.fileType,
      mimeType: communityMedia.mimeType,
    })
    .from(communityMedia)
    .where(
      and(
        eq(communityMedia.status, "ready"),
        inArray(communityMedia.id, ids),
      ),
    );

  return rows.map((r) => ({
    id: r.id,
    url: r.publicUrl,
    variants: r.variants,
    fileType: r.fileType,
    mimeType: r.mimeType,
  }));
}

export async function assertOwnedMedia(
  ownerId: string,
  mediaIds: string[],
): Promise<boolean> {
  if (!mediaIds.length) return true;
  const db = getDb();
  const rows = await db
    .select({ id: communityMedia.id, status: communityMedia.status })
    .from(communityMedia)
    .where(
      and(
        eq(communityMedia.ownerId, ownerId),
        inArray(communityMedia.id, mediaIds),
      ),
    );
  if (rows.length !== mediaIds.length) return false;
  return rows.every((r) => r.status === "ready");
}
