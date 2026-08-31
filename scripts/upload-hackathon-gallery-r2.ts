/**
 * Hackathon gallery — Smash public links → Cloudflare R2 (stream, one file at a time).
 *
 * Run on VPS (R2 creds in ops/vps/.env):
 *   cd /opt/mcbuleli
 *   node --env-file=ops/vps/.env ./node_modules/.bin/tsx scripts/upload-hackathon-gallery-r2.ts
 *
 *   node --env-file=ops/vps/.env ./node_modules/.bin/tsx scripts/upload-hackathon-gallery-r2.ts --dry-run
 */
import { createHash } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  communityR2Configured,
  communityMediaPublicUrl,
  getCommunityR2Config,
  putCommunityObjectToR2,
  verifyCommunityR2Object,
} from "../src/lib/community/media-r2";

const SMASH_LINKS = [
  { batch: "batch-a", slug: "qWDn~O~YFm-ct" },
  { batch: "batch-b", slug: "Hq8ESr1yiD-ct" },
] as const;

const R2_PREFIX = "mcbuleli-community/hackathon/gallery/2026";
const MANIFEST_PATH = path.resolve(
  process.cwd(),
  "src/lib/hackathon/gallery-manifest.ts",
);

type SmashApiFile = {
  id: string;
  name: string;
  ext?: string;
  size?: number;
  download?: string;
};

type GalleryPhoto = {
  id: string;
  batch: string;
  fileName: string;
  thumbUrl: string;
  hdUrl: string;
};

function loadEnv(): void {
  for (const rel of [".env", "ops/vps/.env"]) {
    const p = path.resolve(process.cwd(), rel);
    if (existsSync(p)) {
      try {
        loadEnvFile(p);
      } catch {
        /* ignore */
      }
    }
  }
}

function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function guessMime(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".heic")) return "image/heic";
  return "image/jpeg";
}

async function fetchWithRetry(url: string, init?: RequestInit, attempts = 4): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(180_000),
      });
      if (res.ok) return res;
      if (res.status >= 500 && i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
        continue;
      }
      return res;
    } catch (e) {
      lastError = e;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function createSmashGuestToken(): Promise<string> {
  const res = await fetchWithRetry("https://iam.us-west-1.fromsmash.co/account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://fromsmash.com",
      Authorization: "true",
    },
    body: "{}",
  });
  if (!res.ok) {
    throw new Error(`Smash IAM account failed: HTTP ${res.status}`);
  }
  const json = (await res.json()) as {
    account?: { token?: { token?: string } };
  };
  const token = json.account?.token?.token;
  if (!token) throw new Error("Smash guest token missing in IAM response");
  return token;
}

async function listSmashFiles(slug: string, token: string): Promise<SmashApiFile[]> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    Origin: "https://fromsmash.com",
  };

  const targetRes = await fetchWithRetry(
    `https://link.fromsmash.co/target/fromsmash.com%2F${encodeURIComponent(slug)}?version=10-2019`,
    { headers },
  );
  if (!targetRes.ok) {
    throw new Error(`Smash target ${slug}: HTTP ${targetRes.status}`);
  }

  const targetJson = (await targetRes.json()) as {
    target?: { url?: string };
  };
  const previewUrl = targetJson.target?.url;
  if (!previewUrl) throw new Error(`Smash target URL missing for ${slug}`);

  const previewBase = previewUrl.replace(/\/preview$/, "");
  const files: SmashApiFile[] = [];
  let next: string | null = null;
  let page = 0;

  do {
    const u = new URL(`${previewBase}/files/preview`);
    u.searchParams.set("limit", "100");
    u.searchParams.set("version", "01-2024");
    if (next) u.searchParams.set("next", next);

    const res = await fetchWithRetry(u.toString(), { headers });
    if (!res.ok) {
      throw new Error(`Smash files ${slug}: HTTP ${res.status}`);
    }

    const json = (await res.json()) as {
      files?: SmashApiFile[];
      next?: string | null;
    };
    files.push(...(json.files ?? []));
    next = json.next ?? null;
    page += 1;
    if (page > 30) break;
  } while (next);

  return files.filter((f) => typeof f.download === "string" && f.download.startsWith("http"));
}

async function uploadFile(args: {
  batch: string;
  file: SmashApiFile;
  index: number;
  dryRun: boolean;
}): Promise<GalleryPhoto | null> {
  const { batch, file, index, dryRun } = args;
  const fileName = file.name || `${file.id}${file.ext ?? ".jpg"}`;
  const ext = path.extname(fileName) || file.ext || ".jpg";
  const base = slugify(path.basename(fileName, ext)) || `photo-${index + 1}`;
  const hash = createHash("sha1").update(`${batch}:${file.id}:${fileName}`).digest("hex").slice(0, 8);
  const objectKey = `${R2_PREFIX}/${batch}/${String(index + 1).padStart(3, "0")}-${base}-${hash}${ext.toLowerCase()}`;
  const mime = guessMime(fileName);
  const downloadUrl = file.download!;
  const photoId = `${batch}-${hash}`;

  if (dryRun) {
    return {
      id: photoId,
      batch,
      fileName,
      thumbUrl: downloadUrl,
      hdUrl: downloadUrl,
    };
  }

  const cfg = getCommunityR2Config();
  if (!cfg) return null;

  const exists = await verifyCommunityR2Object({ objectKey, minSizeBytes: 1024 });
  if (exists) {
    const publicUrl = communityMediaPublicUrl(cfg, objectKey);
    console.log(`[r2] skip existing ${fileName}`);
    return { id: photoId, batch, fileName, thumbUrl: publicUrl, hdUrl: publicUrl };
  }

  console.log(`[r2] ${fileName} → ${objectKey}`);
  const res = await fetchWithRetry(downloadUrl);
  if (!res.ok) {
    console.error(`[download] failed ${fileName}: HTTP ${res.status}`);
    return null;
  }
  const body = new Uint8Array(await res.arrayBuffer());
  if (body.byteLength < 1024) {
    console.error(`[download] skip tiny ${fileName} (${body.byteLength} B)`);
    return null;
  }

  const publicUrl = await putCommunityObjectToR2({
    objectKey,
    body,
    mimeType: mime,
  });
  if (!publicUrl) return null;

  return {
    id: photoId,
    batch,
    fileName,
    thumbUrl: publicUrl,
    hdUrl: publicUrl,
  };
}

function writeManifest(photos: GalleryPhoto[]): void {
  const body = `/**
 * McBuleli Hackathon Kinshasa 2026 — photo gallery (R2).
 * Generated by scripts/upload-hackathon-gallery-r2.ts — do not edit by hand.
 */
export type HackathonGalleryPhoto = {
  id: string;
  batch: string;
  fileName: string;
  thumbUrl: string;
  hdUrl: string;
};

export const HACKATHON_GALLERY_PHOTOS: HackathonGalleryPhoto[] = ${JSON.stringify(photos, null, 2)};

export const HACKATHON_GALLERY_READY = HACKATHON_GALLERY_PHOTOS.length > 0;
`;
  writeFileSync(MANIFEST_PATH, body, "utf8");
  console.log(`[manifest] ${photos.length} photo(s) → ${MANIFEST_PATH}`);
}

async function main(): Promise<void> {
  loadEnv();
  const dryRun = process.argv.includes("--dry-run");
  const batchFilter = process.argv.find((a) => a.startsWith("--batch="))?.slice(8);

  if (!dryRun && !communityR2Configured()) {
    console.error("ERROR: COMMUNITY_R2_* missing. Use node --env-file=ops/vps/.env on the VPS.");
    process.exit(1);
  }

  let allPhotos: GalleryPhoto[] = [];
  if (existsSync(MANIFEST_PATH)) {
    try {
      const mod = await import("../src/lib/hackathon/gallery-manifest");
      allPhotos = [...mod.HACKATHON_GALLERY_PHOTOS];
    } catch {
      /* fresh run */
    }
  }

  const token = await createSmashGuestToken();
  const links = batchFilter
    ? SMASH_LINKS.filter((l) => l.batch === batchFilter)
    : SMASH_LINKS;

  for (const { batch, slug } of links) {
    allPhotos = allPhotos.filter((p) => p.batch !== batch);
    console.log(`[smash] listing ${slug}…`);
    const files = await listSmashFiles(slug, token);
    console.log(`[smash] ${slug} → ${files.length} file(s)`);
    if (files.length === 0) continue;

    for (let i = 0; i < files.length; i++) {
      const photo = await uploadFile({ batch, file: files[i]!, index: i, dryRun });
      if (photo) allPhotos.push(photo);
    }
    writeManifest(allPhotos);
  }

  if (allPhotos.length === 0) {
    console.error("ERROR: no photos uploaded.");
    process.exit(1);
  }

  writeManifest(allPhotos);
  console.log(`OK ${allPhotos.length} photo(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
