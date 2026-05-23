/**
 * Regenerate square PWA icons — green tile, white circle, logo centered (less “volume”).
 * Run: npm run icons:pwa
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const logo = path.join(root, "public/brand/logo.png");
const iconsDir = path.join(root, "public/icons");

/** McBuleli primary green */
const GREEN = { r: 48, g: 95, b: 51, alpha: 1 };
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

/**
 * @param {number} size
 * @param {{ circleRatio?: number; logoInCircle?: number }} opts
 */
async function writeAppIcon(outPath, size, opts = {}) {
  const circleRatio = opts.circleRatio ?? 0.52;
  const logoInCircle = opts.logoInCircle ?? 0.58;
  const circleD = Math.round(size * circleRatio);
  const circleR = Math.round(circleD / 2);
  const cx = Math.floor(size / 2);
  const cy = Math.floor(size / 2);

  const circleSvg = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="rgb(${GREEN.r},${GREEN.g},${GREEN.b})"/>
      <circle cx="${cx}" cy="${cy}" r="${circleR}" fill="white"/>
    </svg>`,
  );

  const meta = await sharp(logo).metadata();
  const lw = meta.width ?? 228;
  const lh = meta.height ?? 226;
  const inner = Math.round(circleD * logoInCircle);
  const scale = Math.min(inner / lw, inner / lh);
  const nw = Math.max(1, Math.round(lw * scale));
  const nh = Math.max(1, Math.round(lh * scale));
  const resized = await sharp(logo).resize(nw, nh).png().toBuffer();
  const left = cx - Math.floor(nw / 2);
  const top = cy - Math.floor(nh / 2);

  await sharp(circleSvg)
    .composite([{ input: resized, left, top }])
    .png()
    .toFile(outPath);
}

async function main() {
  await mkdir(iconsDir, { recursive: true });
  const sizes = [
    { file: "icon-96.png", size: 96 },
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
    await writeAppIcon(out, size);
    console.log("wrote", out, `${size}x${size}`);
  }
  for (const size of [192, 512]) {
    const out = path.join(iconsDir, `icon-maskable-${size}.png`);
    await writeAppIcon(out, size, { circleRatio: 0.5, logoInCircle: 0.55 });
    console.log("wrote", out);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
