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

export function communityR2EnvPresent(): boolean {
  return Boolean(
    process.env.COMMUNITY_R2_ACCOUNT_ID?.trim() &&
      process.env.COMMUNITY_R2_BUCKET?.trim() &&
      process.env.COMMUNITY_R2_ACCESS_KEY_ID?.trim() &&
      process.env.COMMUNITY_R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.COMMUNITY_R2_PUBLIC_BASE_URL?.trim(),
  );
}

export function communityR2Configured(): boolean {
  return Boolean(getCommunityR2Config());
}

/** Detect common misconfiguration (API token pasted as S3 secret). */
export function communityR2CredentialWarnings(): string[] {
  const warnings: string[] = [];
  const secret = process.env.COMMUNITY_R2_SECRET_ACCESS_KEY?.trim() ?? "";
  const accessKey = process.env.COMMUNITY_R2_ACCESS_KEY_ID?.trim() ?? "";
  if (secret.startsWith("cfat_") || secret.startsWith("Bearer ")) {
    warnings.push(
      "COMMUNITY_R2_SECRET_ACCESS_KEY looks like a Cloudflare API token — use the R2 S3 secret access key from « Manage R2 API Tokens ».",
    );
  }
  if (accessKey && accessKey.length < 16) {
    warnings.push(
      "COMMUNITY_R2_ACCESS_KEY_ID looks too short — use the S3 access key id from R2 API tokens, not a token label.",
    );
  }
  return warnings;
}

export function getCommunityR2Config(): CommunityR2Config | null {
  const accountId = process.env.COMMUNITY_R2_ACCOUNT_ID?.trim();
  const bucket = process.env.COMMUNITY_R2_BUCKET?.trim();
  const publicBaseUrl = process.env.COMMUNITY_R2_PUBLIC_BASE_URL?.trim();
  const accessKeyId = process.env.COMMUNITY_R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.COMMUNITY_R2_SECRET_ACCESS_KEY?.trim();
  if (
    !accountId ||
    !bucket ||
    !publicBaseUrl ||
    !accessKeyId ||
    !secretAccessKey ||
    communityR2CredentialWarnings().length > 0
  ) {
    return null;
  }
  return {
    accountId,
    bucket,
    publicBaseUrl: publicBaseUrl.replace(/\/$/, ""),
    accessKeyId,
    secretAccessKey,
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
    // AWS SDK 3.729+ sends CRC32 by default; R2 rejects it without this.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
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

  try {
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
  } catch (e) {
    console.error("[community/r2] putObject failed", {
      key: args.objectKey,
      message: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
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
