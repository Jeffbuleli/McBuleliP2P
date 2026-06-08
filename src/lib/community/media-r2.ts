/**
 * Cloudflare R2 — presign upload (Phase 1b).
 * Métadonnées en PostgreSQL uniquement ; binaires jamais sur Render.
 */

export type CommunityR2Config = {
  accountId: string;
  bucket: string;
  publicBaseUrl: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export function communityR2Configured(): boolean {
  return Boolean(
    process.env.COMMUNITY_R2_ACCOUNT_ID &&
      process.env.COMMUNITY_R2_BUCKET &&
      process.env.COMMUNITY_R2_ACCESS_KEY_ID &&
      process.env.COMMUNITY_R2_SECRET_ACCESS_KEY &&
      process.env.COMMUNITY_R2_PUBLIC_BASE_URL,
  );
}

export function communityMediaKey(
  kind: "avatars" | "posts" | "blogs" | "covers",
  ownerId: string,
  fileName: string,
): string {
  const now = new Date();
  const ym = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `mcbuleli-community/${kind}/${ym}/${ownerId}/${fileName}`;
}

/** Stub — implémentation AWS SDK v3 @aws-sdk/client-s3 en Phase 1b. */
export async function createCommunityUploadUrl(_args: {
  ownerId: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ uploadUrl: string; publicUrl: string } | null> {
  if (!communityR2Configured()) return null;
  return null;
}
