#!/usr/bin/env node
/**
 * Visuels lancement HQ — PNG + logos depuis logo source 1024px.
 * Usage: npm run launch:generate-social
 */
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "launch");
const brand = join(root, "public", "brand");
const portrait = join(out, "jeff-portrait.png");
const logoSrc = join(brand, "logo.png");

mkdirSync(out, { recursive: true });

const PNG_OPTS = { compressionLevel: 6, adaptiveFiltering: true };

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

/** Icônes minimalistes McBuleli (illustrations inline). */
function topicIconsSvg(x, y, scale = 1) {
  const s = scale;
  return `
  <g transform="translate(${x},${y}) scale(${s})" fill="none" stroke="#c5e8d0" stroke-width="2.5">
    <g transform="translate(0,0)">
      <circle cx="24" cy="24" r="18" opacity="0.35"/>
      <path d="M14 32l8-14 6 8 6-6" stroke-linecap="round"/>
    </g>
    <g transform="translate(56,0)">
      <rect x="14" y="28" width="5" height="10" fill="#c5e8d0" opacity="0.5"/>
      <rect x="22" y="22" width="5" height="16" fill="#c5e8d0" opacity="0.7"/>
      <rect x="30" y="14" width="5" height="24" fill="#c5e8d0"/>
    </g>
    <g transform="translate(112,0)">
      <rect x="12" y="16" width="24" height="16" rx="4"/>
      <circle cx="18" cy="24" r="2.5" fill="#c5e8d0"/>
      <circle cx="30" cy="24" r="2.5" fill="#c5e8d0"/>
    </g>
    <g transform="translate(168,0)">
      <circle cx="18" cy="20" r="7"/>
      <circle cx="34" cy="28" r="7"/>
      <path d="M24 24h4l4 4" stroke-linecap="round"/>
    </g>
  </g>`;
}

async function logoBuffer(size) {
  return sharp(logoSrc)
    .resize(size, size, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();
}

async function exportLogos() {
  const master = await sharp(logoSrc)
    .resize(1024, 1024, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  await sharp(master).png(PNG_OPTS).toFile(join(brand, "logo-1024.png"));
  await sharp(master)
    .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png(PNG_OPTS)
    .toFile(join(brand, "logo-512.png"));
  await sharp(master)
    .resize(256, 256, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png(PNG_OPTS)
    .toFile(join(brand, "logo-256.png"));
  await sharp(master).png(PNG_OPTS).toFile(join(brand, "logo.png"));
  console.log("✓ logo.png + logo-256/512/1024");
}

/** Fond diagonal type webinar (minimaliste). */
function posterSvg(w, h, variant) {
  const isStory = variant === "story";
  const isLandscape = variant === "landscape";
  const diag = isLandscape
    ? `<polygon points="0,0 ${w},0 ${Math.round(w * 0.58)},${h} 0,${h}" fill="#305f33"/>
       <polygon points="${Math.round(w * 0.52)},0 ${w},0 ${w},${h} ${Math.round(w * 0.48)},${h}" fill="#244a27" opacity="0.92"/>`
    : isStory
      ? `<rect width="100%" height="100%" fill="#305f33"/>
         <polygon points="0,${Math.round(h * 0.42)} ${w},${Math.round(h * 0.32)} ${w},${h} 0,${h}" fill="#1a2e1c"/>`
      : `<polygon points="0,0 ${w},0 ${w},${Math.round(h * 0.72)} 0,${h}" fill="#305f33"/>
         <rect x="0" y="${Math.round(h * 0.68)}" width="${w}" height="${Math.round(h * 0.32)}" fill="#e8f3ee" opacity="0.12"/>`;

  const titleSize = isStory ? 72 : isLandscape ? 56 : 80;
  const titleY = isStory ? 200 : isLandscape ? 140 : 200;
  const titleX = isStory ? w / 2 : isLandscape ? 56 : 72;

  const liveBadge = `<rect x="${isStory ? w / 2 - 100 : 56}" y="${isStory ? 100 : isLandscape ? 48 : 88}" width="200" height="44" rx="22" fill="#e8f3ee"/>
    <text x="${isStory ? w / 2 : 156}" y="${isStory ? 130 : isLandscape ? 78 : 118}" text-anchor="${isStory ? "middle" : "middle"}" fill="#305f33" font-family="system-ui,sans-serif" font-size="18" font-weight="800">LIVE · MCBULELI</text>`;

  const title = `<text x="${titleX}" y="${titleY}" text-anchor="${isStory ? "middle" : "start"}" fill="#fff" font-family="system-ui,sans-serif" font-size="${titleSize}" font-weight="900">Formation</text>
    <text x="${titleX}" y="${titleY + (isStory ? 56 : 48)}" text-anchor="${isStory ? "middle" : "start"}" fill="#c5e8d0" font-family="system-ui,sans-serif" font-size="${isStory ? 32 : isLandscape ? 28 : 36}" font-weight="700">Crypto · Trading · IA · P2P</text>`;

  const dateY = isStory ? titleY + 120 : titleY + 100;
  const date = `<text x="${titleX}" y="${dateY}" text-anchor="${isStory ? "middle" : "start"}" fill="#fff" font-family="system-ui,sans-serif" font-size="${isStory ? 28 : 24}" font-weight="700">8 juin 2026 · 19h GMT+1</text>
    <text x="${titleX}" y="${dateY + 40}" text-anchor="${isStory ? "middle" : "start"}" fill="#e8f3ee" font-family="system-ui,sans-serif" font-size="22" font-weight="600">15–30 juin · samedis 18h30–20h</text>`;

  const iconsY = isStory ? dateY + 100 : isLandscape ? dateY + 50 : dateY + 70;
  const iconsX = isStory ? w / 2 - 100 : isLandscape ? 56 : 72;
  const icons = topicIconsSvg(iconsX, iconsY, isStory ? 1.1 : 0.85);

  const ctaY = isStory ? h - 200 : isLandscape ? h - 100 : h - 120;
  const ctaX = isStory ? w / 2 - 180 : isLandscape ? 56 : 72;
  const cta = `<rect x="${ctaX}" y="${ctaY}" width="360" height="64" rx="16" fill="#fff"/>
    <text x="${ctaX + 180}" y="${ctaY + 42}" text-anchor="middle" fill="#305f33" font-family="system-ui,sans-serif" font-size="26" font-weight="800">mcbuleli.org/formation</text>
    <text x="${ctaX + 180}" y="${ctaY + 68}" text-anchor="middle" fill="#e8f3ee" font-family="system-ui,sans-serif" font-size="16" font-weight="600">Gratuit · 2 semaines</text>`;

  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1a2e1c"/>
          <stop offset="100%" stop-color="#3d7a42"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      ${diag}
      ${liveBadge}
      ${title}
      ${date}
      ${icons}
      ${cta}
    </svg>`,
  );
}

async function buildPoster(name, w, h, variant) {
  const logoSize = variant === "story" ? 140 : 100;
  const logo = await logoBuffer(logoSize);

  const portraitW = variant === "story" ? Math.round(w * 0.92) : Math.round(w * 0.44);
  const portraitH =
    variant === "story" ? Math.round(h * 0.38) : variant === "landscape" ? h : Math.round(h * 0.55);

  const portraitBuf = await sharp(portrait)
    .resize(portraitW, portraitH, { fit: "cover", position: "attention" })
    .png()
    .toBuffer();

  const layer = await sharp(posterSvg(w, h, variant)).png().toBuffer();

  const portraitLeft =
    variant === "story" ? Math.round((w - portraitW) / 2) : w - portraitW;
  const portraitTop =
    variant === "story" ? Math.round(h * 0.36) : variant === "landscape" ? 0 : Math.round(h * 0.38);

  const logoLeft = variant === "story" ? Math.round((w - logoSize) / 2) : 56;
  const logoTop = variant === "story" ? 24 : variant === "landscape" ? 520 : 40;

  const composites = [
    { input: layer, left: 0, top: 0 },
    { input: portraitBuf, left: portraitLeft, top: portraitTop },
    { input: logo, left: logoLeft, top: logoTop },
  ];

  if (variant !== "story") {
    const maskSvg = Buffer.from(
      `<svg width="${portraitW}" height="${h}"><defs><linearGradient id="m" x1="0" x2="1"><stop offset="0%" stop-color="#305f33" stop-opacity="0.9"/><stop offset="35%" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#m)"/></svg>`,
    );
    const mask = await sharp(maskSvg).resize(portraitW, h).png().toBuffer();
    composites.splice(2, 0, { input: mask, left: portraitLeft, top: 0, blend: "over" });
  }

  await sharp({
    create: { width: w, height: h, channels: 4, background: { r: 26, g: 46, b: 28, alpha: 1 } },
  })
    .composite(composites)
    .png(PNG_OPTS)
    .toFile(join(out, `${name}.png`));

  console.log(`✓ launch/${name}.png (${w}×${h})`);
}

/** Affiche mobile homepage (4:5). */
async function buildHeroMobile() {
  const w = 1080;
  const h = 1350;
  await buildPoster("hero-mobile", w, h, "story");
}

await exportLogos();
await buildPoster("social-square", 1080, 1080, "square");
await buildPoster("social-landscape", 1200, 630, "landscape");
await buildPoster("social-story", 1080, 1920, "story");
await buildHeroMobile();
console.log("\n→ https://mcbuleli.org/launch/assets");
