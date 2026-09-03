/**
 * Upload NGEMBA brand + email assets to Cyber Alert R2.
 *
 *   cd services/ngemba && npm install
 *   node --env-file=../../.env --import tsx scripts/upload-brand-r2.ts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  ngembaObjectExists,
  ngembaPublicUrl,
  putNgembaObject,
} from "../src/lib/media/r2";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const ASSETS: Array<{
  key: string;
  mime: string;
  local?: string;
  remote?: string;
}> = [
  {
    local: "public/brand/ngemba-logo.png",
    key: "ngemba/brand/ngemba-logo.png",
    mime: "image/png",
  },
  {
    remote: "https://mcbuleli.org/brand/logo-256.png",
    key: "ngemba/brand/mcbuleli-logo-256.png",
    mime: "image/png",
  },
  {
    remote: "https://mcbuleli.org/email/email-security.png",
    key: "ngemba/email/email-security.png",
    mime: "image/png",
  },
];

async function main() {
  for (const asset of ASSETS) {
    if (await ngembaObjectExists(asset.key)) {
      console.log("skip", ngembaPublicUrl(asset.key));
      continue;
    }
    const body = asset.local
      ? fs.readFileSync(path.join(ROOT, asset.local))
      : await fetchBuffer(asset.remote!);
    const url = await putNgembaObject({
      objectKey: asset.key,
      body: new Uint8Array(body),
      mimeType: asset.mime,
    });
    if (!url) {
      console.error("upload failed", asset.key);
      process.exit(1);
    }
    console.log("uploaded", url);
  }
}

void main();
