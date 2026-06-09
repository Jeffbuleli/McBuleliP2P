/**
 * Cloudflare R2 — presigned upload (S3-compatible API).
 * @see https://developers.cloudflare.com/r2/
 */

import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

export function getCommunityR2Config(): CommunityR2Config | null {
  if (!communityR2Configured()) return null;
  return {
    accountId: process.env.COMMUNITY_R2_ACCOUNT_ID!.trim(),
    bucket: process.env.COMMUNITY_R2_BUCKET!.trim(),
    publicBaseUrl: process.env.COMMUNITY_R2_PUBLIC_BASE_URL!.trim().replace(/\/$/, ""),
    accessKeyId: process.env.COMMUNITY_R2_ACCESS_KEY_ID!.trim(),
    secretAccessKey: process.env.COMMUNITY_R2_SECRET_ACCESS_KEY!.trim(),
  };
}

function getR2Client(cfg: CommunityR2Config): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
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

export function communityMediaPublicUrl(
  cfg: CommunityR2Config,
  objectKey: string,
): string {
  return `${cfg.publicBaseUrl}/${objectKey}`;
}

export async function createCommunityUploadUrl(args: {
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ uploadUrl: string; publicUrl: string; bucket: string } | null> {
  const cfg = getCommunityR2Config();
  if (!cfg) return null;

  const client = getR2Client(cfg);
  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: args.objectKey,
    ContentType: args.mimeType,
    ContentLength: args.sizeBytes,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });
  return {
    uploadUrl,
    publicUrl: communityMediaPublicUrl(cfg, args.objectKey),
    bucket: cfg.bucket,
  };
}

export async function putCommunityObjectToR2(args: {
  objectKey: string;
  body: Uint8Array;
  mimeType: string;
}): Promise<string | null> {
  const cfg = getCommunityR2Config();
  if (!cfg) return null;

  const client = getR2Client(cfg);
  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: args.objectKey,
      Body: args.body,
      ContentType: args.mimeType,
    }),
  );
  return communityMediaPublicUrl(cfg, args.objectKey);
}

export async function verifyCommunityR2Object(args: {
  objectKey: string;
  minSizeBytes?: number;
}): Promise<boolean> {
  const cfg = getCommunityR2Config();
  if (!cfg) return false;

  try {
    const client = getR2Client(cfg);
    const head = await client.send(
      new HeadObjectCommand({
        Bucket: cfg.bucket,
        Key: args.objectKey,
      }),
    );
    if (args.minSizeBytes != null && (head.ContentLength ?? 0) < args.minSizeBytes) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
