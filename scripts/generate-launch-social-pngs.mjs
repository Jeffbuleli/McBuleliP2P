#!/usr/bin/env node
/**
 * PNG réseaux sociaux + logo haute résolution (WhatsApp/FB/IG n’affichent pas bien les SVG seuls).
 * Usage: npm run launch:generate-social
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "launch");
const brand = join(root, "public", "brand");
const portrait = join(out, "jeff-portrait.png");
const logo = join(brand, "logo.png");

mkdirSync(out, { recursive: true });
mkdirSync(brand, { recursive: true });

/** Logo 512px pour RS et écrans retina (évite le flou au redimensionnement). */
async function exportLogo512() {
  await sharp(logo)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(join(brand, "logo-512.png"));

  await sharp(logo)
    .resize(256, 256, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9 })
    .toFile(join(brand, "logo-256.png"));

  console.log("✓ brand/logo-512.png, logo-256.png");
}

function gradientSvg(w, h) {
  return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a2e1c"/>
      <stop offset="50%" stop-color="#305f33"/>
      <stop offset="100%" stop-color="#244a27"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`);
}

async function textOverlay(w, h, layout) {
  const lines =
    layout === "story"
      ? [
          { y: 140, size: 32, fill: "#e8f3ee", text: "MCBULELI", anchor: "middle", x: w / 2 },
          { y: 260, size: 64, fill: "#fff", text: "Formation", anchor: "middle", x: w / 2 },
          { y: 340, size: 34, fill: "#c5e8d0", text: "Crypto · Trading", anchor: "middle", x: w / 2 },
          { y: 390, size: 34, fill: "#c5e8d0", text: "IA · P2P", anchor: "middle", x: w / 2 },
          { y: 500, size: 30, fill: "#fff", text: "8 juin · 19h GMT+1", anchor: "middle", x: w / 2 },
          { y: 560, size: 26, fill: "#e8f3ee", text: "15–30 juin · samedis 18h30–20h", anchor: "middle", x: w / 2 },
          { y: 1720, size: 24, fill: "#c5e8d0", text: "mcbuleli.org/formation", anchor: "middle", x: w / 2 },
        ]
      : layout === "landscape"
        ? [
            { y: 70, size: 22, fill: "#e8f3ee", text: "LANCement MCBULELI", x: 48 },
            { y: 150, size: 52, fill: "#fff", text: "Formation en ligne", x: 48 },
            { y: 210, size: 30, fill: "#c5e8d0", text: "Crypto · Trading · IA · P2P", x: 48 },
            { y: 280, size: 26, fill: "#fff", text: "8 juin 2026 · 19h (GMT+1)", x: 48 },
            { y: 330, size: 22, fill: "#e8f3ee", text: "15–30 juin · gratuit · 2 semaines", x: 48 },
            { y: 420, size: 22, fill: "#305f33", text: "mcbuleli.org/formation", x: 72 },
          ]
        : [
            { y: 100, size: 28, fill: "#e8f3ee", text: "MCBULELI", x: 72 },
            { y: 190, size: 68, fill: "#fff", text: "Formation", x: 72 },
            { y: 270, size: 40, fill: "#c5e8d0", text: "Crypto · Trading · IA · P2P", x: 72 },
            { y: 340, size: 28, fill: "#fff", text: "8 juin 2026 · 19h GMT+1", x: 72 },
            { y: 400, size: 24, fill: "#e8f3ee", text: "15–30 juin · samedis 18h30–20h", x: 72 },
            { y: 450, size: 24, fill: "#e8f3ee", text: "Gratuit · 2 semaines", x: 72 },
            { y: 1000, size: 22, fill: "#c5e8d0", text: "Jeff Buleli · McBuleli", x: 72 },
          ];

  const tspans = lines
    .map((l) => {
      const anchor = l.anchor ? ` text-anchor="${l.anchor}"` : "";
      const x = l.x ?? 72;
      return `<text x="${x}" y="${l.y}"${anchor} fill="${l.fill}" font-family="system-ui,-apple-system,sans-serif" font-size="${l.size}" font-weight="800">${escapeXml(l.text)}</text>`;
    })
    .join("");

  const badge =
    layout === "square"
      ? `<rect x="72" y="520" width="400" height="64" rx="14" fill="#fff"/><text x="110" y="562" fill="#305f33" font-family="system-ui,sans-serif" font-size="28" font-weight="800">mcbuleli.org/formation</text>`
      : layout === "landscape"
        ? `<rect x="48" y="390" width="360" height="56" rx="12" fill="#fff"/>`
        : `<rect x="240" y="720" width="600" height="72" rx="18" fill="#fff"/><text x="540" y="768" text-anchor="middle" fill="#305f33" font-family="system-ui,sans-serif" font-size="28" font-weight="800">Inscription gratuite</text>`;

  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${tspans}${badge}</svg>`,
  );
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

async function buildPoster(name, w, h, layout) {
  const logoBuf = await sharp(logo)
    .resize(120, 120, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const portraitW = layout === "story" ? Math.round(w * 0.55) : Math.round(w * 0.42);
  const portraitH = layout === "story" ? Math.round(h * 0.45) : h;

  const portraitBuf = await sharp(portrait)
    .resize(portraitW, portraitH, { fit: "cover", position: "top" })
    .png()
    .toBuffer();

  const bg = await sharp(gradientSvg(w, h)).png().toBuffer();
  const text = await sharp(await textOverlay(w, h, layout)).png().toBuffer();

  const portraitLeft = w - portraitW;
  const portraitTop = layout === "story" ? Math.round(h * 0.38) : 0;

  const logoLeft = layout === "story" ? Math.round((w - 100) / 2) : 72;
  const logoTop = layout === "story" ? 600 : layout === "landscape" ? 48 : 520;

  let composite = sharp(bg).composite([
    { input: portraitBuf, left: portraitLeft, top: portraitTop },
    { input: logoBuf, left: logoLeft, top: logoTop },
    { input: text, left: 0, top: 0 },
  ]);

  if (layout !== "story") {
    const fade = await sharp({
      create: {
        width: portraitW,
        height: h,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        {
          input: Buffer.from(
            `<svg width="${portraitW}" height="${h}"><defs><linearGradient id="f" x1="0" x2="1"><stop offset="0%" stop-color="#305f33" stop-opacity="0.85"/><stop offset="40%" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#f)"/></svg>`,
          ),
          blend: "over",
        },
      ])
      .png()
      .toBuffer();
    composite = sharp(bg).composite([
      { input: portraitBuf, left: portraitLeft, top: 0 },
      { input: fade, left: portraitLeft, top: 0 },
      { input: logoBuf, left: logoLeft, top: logoTop },
      { input: text, left: 0, top: 0 },
    ]);
  }

  const path = join(out, `${name}.png`);
  await composite
    .png({ compressionLevel: 8 })
    .toFile(path);
  console.log(`✓ launch/${name}.png (${w}×${h})`);
}

await exportLogo512();
await buildPoster("social-square", 1080, 1080, "square");
await buildPoster("social-landscape", 1200, 630, "landscape");
await buildPoster("social-story", 1080, 1920, "story");
console.log("\nOuvrir: https://mcbuleli.org/launch/assets");
