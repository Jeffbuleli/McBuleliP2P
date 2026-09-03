import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export type NgembaR2Config = {
  accountId: string;
  bucket: string;
  publicBaseUrl: string;
  accessKeyId: string;
  secretAccessKey: string;
};

function readR2Var(suffix: string): string | undefined {
  return (
    process.env[`NGEMBA_R2_${suffix}`]?.trim() ||
    process.env[`SAFEFIND_R2_${suffix}`]?.trim()
  );
}

function normalizePublicBase(raw: string): string {
  const trimmed = raw.replace(/\/$/, "");
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

export function ngembaR2Configured(): boolean {
  return Boolean(getNgembaR2Config());
}

export function getNgembaR2Config(): NgembaR2Config | null {
  const accountId = readR2Var("ACCOUNT_ID");
  const bucket = readR2Var("BUCKET");
  const publicBaseUrl = readR2Var("PUBLIC_BASE_URL");
  const accessKeyId = readR2Var("ACCESS_KEY_ID");
  const secretAccessKey = readR2Var("SECRET_ACCESS_KEY");
  if (!accountId || !bucket || !publicBaseUrl || !accessKeyId || !secretAccessKey) {
    return null;
  }
  return {
    accountId,
    bucket,
    publicBaseUrl: normalizePublicBase(publicBaseUrl),
    accessKeyId,
    secretAccessKey,
  };
}

function client(cfg: NgembaR2Config): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

export function ngembaMediaKey(
  sessionId: string,
  mediaId: string,
  ext: string,
): string {
  return `ngemba/sessions/${sessionId}/${mediaId}${ext}`;
}

export function ngembaPublicUrl(objectKey: string): string | null {
  const cfg = getNgembaR2Config();
  if (!cfg) return null;
  return `${cfg.publicBaseUrl}/${objectKey}`;
}

export async function putNgembaObject(args: {
  objectKey: string;
  body: Uint8Array;
  mimeType: string;
}): Promise<string | null> {
  const cfg = getNgembaR2Config();
  if (!cfg) return null;
  try {
    await client(cfg).send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: args.objectKey,
        Body: args.body,
        ContentType: args.mimeType,
      }),
    );
    return ngembaPublicUrl(args.objectKey);
  } catch (err) {
    console.warn("[ngemba/r2] putObject failed", err);
    return null;
  }
}

export async function getNgembaObject(objectKey: string): Promise<Buffer | null> {
  const cfg = getNgembaR2Config();
  if (!cfg) return null;
  try {
    const res = await client(cfg).send(
      new GetObjectCommand({ Bucket: cfg.bucket, Key: objectKey }),
    );
    if (!res.Body) return null;
    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch {
    return null;
  }
}

export async function ngembaObjectExists(objectKey: string): Promise<boolean> {
  const cfg = getNgembaR2Config();
  if (!cfg) return false;
  try {
    await client(cfg).send(
      new HeadObjectCommand({ Bucket: cfg.bucket, Key: objectKey }),
    );
    return true;
  } catch {
    return false;
  }
}
