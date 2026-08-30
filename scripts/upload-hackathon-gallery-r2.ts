/**
 * Hackathon gallery — Smash public links → Cloudflare R2 (stream, one file at a time).
 *
 * Run on VPS (R2 creds in ops/vps/.env, disk for Playwright cache):
 *   cd /opt/mcbuleli
 *   set -a && source ops/vps/.env && set +a
 *   npx playwright install chromium
 *   npx tsx scripts/upload-hackathon-gallery-r2.ts
 *
 *   npx tsx scripts/upload-hackathon-gallery-r2.ts --dry-run
 */
import { createHash } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { chromium, type Response } from "playwright";
import {
  communityR2Configured,
  getCommunityR2Config,
  putCommunityObjectToR2,
} from "../src/lib/community/media-r2";

const SMASH_LINKS = [
  { batch: "batch-a", url: "https://fromsmash.com/qWDn~O~YFm-ct" },
  { batch: "batch-b", url: "https://fromsmash.com/Hq8ESr1yiD-ct" },
] as const;

const R2_PREFIX = "mcbuleli-community/hackathon/gallery/2026";
const MANIFEST_PATH = path.resolve(
  process.cwd(),
  "src/lib/hackathon/gallery-manifest.ts",
);

type SmashFile = {
  id: string;
  name: string;
  url: string;
  mimeType?: string;
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

function guessMime(name: string, fallback?: string): string {
  if (fallback?.startsWith("image/")) return fallback;
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".heic")) return "image/heic";
  return "image/jpeg";
}

function isImageName(name: string): boolean {
  return /\.(jpe?g|png|webp|heic|gif)$/i.test(name);
}

function extractFilesFromJson(obj: unknown, out: SmashFile[], seen: Set<string>): void {
  if (!obj || typeof obj !== "object") return;

  if (Array.isArray(obj)) {
    for (const item of obj) extractFilesFromJson(item, out, seen);
    return;
  }

  const record = obj as Record<string, unknown>;
  const name =
    (typeof record.name === "string" && record.name) ||
    (typeof record.fileName === "string" && record.fileName) ||
    (typeof record.filename === "string" && record.filename) ||
    "";

  const urlCandidates = [
    record.downloadUrl,
    record.url,
    record.link,
    record.signedUrl,
    record.href,
  ].filter((v): v is string => typeof v === "string" && v.startsWith("http"));

  if (name && urlCandidates.length > 0 && isImageName(name)) {
    const url = urlCandidates[0]!;
    const id = String(record.id ?? record.fileId ?? record.uuid ?? name);
    const key = `${id}:${url}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({
        id,
        name,
        url,
        mimeType: typeof record.mimeType === "string" ? record.mimeType : undefined,
      });
    }
  }

  for (const value of Object.values(record)) {
    extractFilesFromJson(value, out, seen);
  }
}

async function scrapeSmashLink(linkUrl: string): Promise<SmashFile[]> {
  const browser = await chromium.launch({ headless: true });
  const files: SmashFile[] = [];
  const seen = new Set<string>();
  let bearerToken: string | null = null;

  try {
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    });

    page.on("request", (req) => {
      const auth = req.headers()["authorization"];
      if (auth?.startsWith("Bearer ") && auth.length > 20) {
        bearerToken = auth.slice(7);
      }
    });

    page.on("response", async (response: Response) => {
      const url = response.url();
      if (!url.includes("fromsmash.co")) return;
      if (response.status() !== 200) return;
      const ct = response.headers()["content-type"] ?? "";
      if (!ct.includes("json")) return;
      try {
        const json = await response.json();
        extractFilesFromJson(json, files, seen);
      } catch {
        /* ignore */
      }
    });

    console.log(`[smash] open ${linkUrl}`);
    await page.goto(linkUrl, { waitUntil: "networkidle", timeout: 180_000 });
    await page.waitForTimeout(8_000);

    // Some transfers lazy-load file rows after scroll.
    await page.evaluate(async () => {
      for (let i = 0; i < 6; i++) {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((r) => setTimeout(r, 800));
      }
    });
    await page.waitForTimeout(3_000);

    // Anchor hrefs on download buttons.
    const hrefs = await page.$$eval("a[href]", (anchors) =>
      anchors
        .map((a) => ({ href: a.href, text: a.textContent?.trim() ?? "" }))
        .filter((x) => x.href.startsWith("http")),
    );
    for (const { href } of hrefs) {
      if (!/fromsmash|cloudfront|amazonaws|r2\.cloudflarestorage/i.test(href)) continue;
      const name = decodeURIComponent(href.split("/").pop()?.split("?")[0] ?? "");
      if (name && isImageName(name)) {
        const key = `${name}:${href}`;
        if (!seen.has(key)) {
          seen.add(key);
          files.push({ id: name, name, url: href });
        }
      }
    }

    if (files.length === 0 && bearerToken) {
      const slug = linkUrl.replace(/\/$/, "").split("/").pop() ?? "";
      const targetUrls = [
        `https://link.fromsmash.co/target/${slug}`,
        `https://transfer.eu-west-3.fromsmash.co/transfers/${slug}`,
      ];
      for (const apiUrl of targetUrls) {
        const res = await fetch(apiUrl, {
          headers: {
            Accept: "application/json",
            Origin: "https://fromsmash.com",
            Authorization: `Bearer ${bearerToken}`,
          },
        });
        if (!res.ok) continue;
        const json = await res.json();
        extractFilesFromJson(json, files, seen);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`[smash] ${linkUrl} → ${files.length} image(s)`);
  return files;
}

async function uploadFile(args: {
  batch: string;
  file: SmashFile;
  index: number;
  dryRun: boolean;
}): Promise<GalleryPhoto | null> {
  const { batch, file, index, dryRun } = args;
  const ext = path.extname(file.name) || ".jpg";
  const base = slugify(path.basename(file.name, ext)) || `photo-${index + 1}`;
  const hash = createHash("sha1").update(`${batch}:${file.id}:${file.name}`).digest("hex").slice(0, 8);
  const objectKey = `${R2_PREFIX}/${batch}/${String(index + 1).padStart(3, "0")}-${base}-${hash}${ext.toLowerCase()}`;
  const mime = guessMime(file.name, file.mimeType);

  if (dryRun) {
    return {
      id: `${batch}-${hash}`,
      batch,
      fileName: file.name,
      thumbUrl: file.url,
      hdUrl: file.url,
    };
  }

  const cfg = getCommunityR2Config();
  if (!cfg) {
    throw new Error("COMMUNITY_R2_* not configured");
  }

  console.log(`[r2] ${file.name} → ${objectKey}`);
  const res = await fetch(file.url);
  if (!res.ok) {
    console.error(`[r2] download failed ${file.name}: HTTP ${res.status}`);
    return null;
  }
  const body = new Uint8Array(await res.arrayBuffer());
  if (body.byteLength < 1024) {
    console.error(`[r2] skip tiny file ${file.name} (${body.byteLength} B)`);
    return null;
  }

  const publicUrl = await putCommunityObjectToR2({
    objectKey,
    body,
    mimeType: mime,
  });
  if (!publicUrl) return null;

  return {
    id: `${batch}-${hash}`,
    batch,
    fileName: file.name,
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

  if (!dryRun && !communityR2Configured()) {
    console.error("ERROR: COMMUNITY_R2_* missing. Source ops/vps/.env on the VPS.");
    process.exit(1);
  }

  const allPhotos: GalleryPhoto[] = [];

  for (const { batch, url } of SMASH_LINKS) {
    const files = await scrapeSmashLink(url);
    if (files.length === 0) {
      console.warn(`WARN: no images found for ${url}`);
      continue;
    }
    for (let i = 0; i < files.length; i++) {
      const photo = await uploadFile({ batch, file: files[i]!, index: i, dryRun });
      if (photo) allPhotos.push(photo);
    }
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
