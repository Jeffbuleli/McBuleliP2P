/**
 * Regenerate square PWA icons from public/brand/logo.png (Chromium requires exact sizes).
 * Run: node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const logo = path.join(root, "public/brand/logo.png");
const iconsDir = path.join(root, "public/icons");
const bg = { r: 244, g: 246, b: 245, alpha: 1 };

async function writeSquare(outPath, size, logoScale = 0.78) {
  const meta = await sharp(logo).metadata();
  const lw = meta.width ?? 228;
  const lh = meta.height ?? 226;
  const inner = Math.round(size * logoScale);
  const scale = Math.min(inner / lw, inner / lh);
  const nw = Math.max(1, Math.round(lw * scale));
  const nh = Math.max(1, Math.round(lh * scale));
  const resized = await sharp(logo).resize(nw, nh).png().toBuffer();
  const left = Math.floor((size - nw) / 2);
  const top = Math.floor((size - nh) / 2);

  await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toFile(outPath);
}

async function main() {
  await mkdir(iconsDir, { recursive: true });
  const sizes = [
    { file: "icon-144.png", size: 144 },
    { file: "icon-192.png", size: 192 },
    { file: "icon-256.png", size: 256 },
    { file: "icon-512.png", size: 512 },
    { file: "../apple-touch-icon.png", size: 180 },
  ];
  for (const { file, size } of sizes) {
    const out = file.startsWith("..")
      ? path.join(root, "public", path.basename(file))
      : path.join(iconsDir, file);
    await writeSquare(out, size);
    console.log("wrote", out, size + "x" + size);
  }
  // Maskable: full-bleed safe zone on brand green
  const maskBg = { r: 22, g: 101, b: 52, alpha: 1 };
  for (const size of [192, 512]) {
    const inner = Math.round(size * 0.62);
    const meta = await sharp(logo).metadata();
    const lw = meta.width ?? 228;
    const lh = meta.height ?? 226;
    const scale = Math.min(inner / lw, inner / lh);
    const nw = Math.max(1, Math.round(lw * scale));
    const nh = Math.max(1, Math.round(lh * scale));
    const resized = await sharp(logo).resize(nw, nh).png().toBuffer();
    const left = Math.floor((size - nw) / 2);
    const top = Math.floor((size - nh) / 2);
    const out = path.join(iconsDir, `icon-maskable-${size}.png`);
    await sharp({
      create: { width: size, height: size, channels: 4, background: maskBg },
    })
      .composite([{ input: resized, left, top }])
      .png()
      .toFile(out);
    console.log("wrote", out);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
