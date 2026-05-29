/**
 * Resize email PNGs for inbox + Resend templates (embedded base64).
 * Run: node scripts/email-optimize-assets.mjs
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const MAX = 320;

async function optimizeFile(absPath) {
  const before = (await sharp(absPath).metadata()).size ?? 0;
  const buf = await sharp(absPath)
    .resize(MAX, MAX, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 82 })
    .toBuffer();
  await sharp(buf).toFile(absPath);
  const kb = Math.round(buf.length / 1024);
  console.log(`  ${absPath.replace(ROOT + "/", "")} → ${kb} KB (was ~${Math.round(before / 1024)} KB)`);
}

async function main() {
  console.log("Optimizing McBuleli email images…\n");
  await optimizeFile(join(ROOT, "public/brand/logo.png"));
  const emailDir = join(ROOT, "public/email");
  const files = (await readdir(emailDir)).filter((f) => f.endsWith(".png"));
  for (const f of files.sort()) {
    await optimizeFile(join(emailDir, f));
  }
  console.log("\nDone. Re-run: npm run resend:sync-templates");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
