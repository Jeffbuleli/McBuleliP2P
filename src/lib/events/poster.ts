import type { EventRecord, PosterTemplate } from "@/lib/events/types";

const SIZES: Record<PosterTemplate, { w: number; h: number }> = {
  portrait: { w: 1080, h: 1350 },
  square: { w: 1080, h: 1080 },
  banner: { w: 1920, h: 1080 },
};

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatEventDate(d: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: tz,
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function formatEventTime(d: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz,
    }).format(d);
  } catch {
    return d.toISOString().slice(11, 16);
  }
}

export function buildEventPosterSvg(
  event: Pick<
    EventRecord,
    "title" | "trainerName" | "startDate" | "timezone" | "price" | "eventType" | "coverImage"
  >,
  template: PosterTemplate,
): string {
  const { w, h } = SIZES[template];
  const dateStr = formatEventDate(event.startDate, event.timezone);
  const timeStr = formatEventTime(event.startDate, event.timezone);
  const priceLabel =
    event.eventType === "PAID" && Number(event.price) > 0
      ? `${Number(event.price)} USDT`
      : "Gratuit";
  const titleSize = template === "banner" ? 56 : 44;
  const titleY = template === "banner" ? 420 : template === "portrait" ? 520 : 480;

  const coverBlock = event.coverImage
    ? `<image href="${escXml(event.coverImage)}" x="80" y="180" width="${w - 160}" height="${template === "portrait" ? 320 : 240}" preserveAspectRatio="xMidYMid slice" clip-path="url(#coverClip)"/>`
    : `<rect x="80" y="180" width="${w - 160}" height="${template === "portrait" ? 320 : 240}" rx="24" fill="#e8f3e9"/>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f4faf4"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
    <clipPath id="coverClip"><rect x="80" y="180" width="${w - 160}" height="${template === "portrait" ? 320 : 240}" rx="24"/></clipPath>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect x="48" y="48" width="${w - 96}" height="${h - 96}" rx="32" fill="#fff" stroke="#d8ead9" stroke-width="3"/>
  <text x="120" y="120" font-family="Arial,sans-serif" font-size="36" font-weight="800" fill="#305f33">McBuleli</text>
  <text x="120" y="155" font-family="Arial,sans-serif" font-size="18" fill="#5a7a5c">Formation &#183; McBuleli Live</text>
  ${coverBlock}
  <text x="${w / 2}" y="${titleY}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${titleSize}" font-weight="900" fill="#1a2e1b">${escXml(event.title.slice(0, 80))}</text>
  <text x="${w / 2}" y="${titleY + 48}" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" fill="#305f33">${escXml(dateStr)}</text>
  <text x="${w / 2}" y="${titleY + 88}" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" fill="#5a7a5c">${escXml(timeStr)} &#183; ${escXml(event.timezone)}</text>
  <text x="${w / 2}" y="${titleY + 140}" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#2d4a2f">Formateur : ${escXml(event.trainerName)}</text>
  <rect x="${w / 2 - 120}" y="${titleY + 170}" width="240" height="52" rx="26" fill="#305f33"/>
  <text x="${w / 2}" y="${titleY + 204}" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="700" fill="#fff">${escXml(priceLabel)}</text>
  <text x="${w / 2}" y="${h - 80}" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#8aa08c">mcbuleli.org &#183; McBuleli Live</text>
</svg>`;
}

export async function renderEventPosterBuffer(args: {
  event: Pick<
    EventRecord,
    "title" | "trainerName" | "startDate" | "timezone" | "price" | "eventType" | "coverImage"
  >;
  template: PosterTemplate;
  format: "png" | "jpeg";
}): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const svg = buildEventPosterSvg(args.event, args.template);
  const { w, h } = SIZES[args.template];
  const img = sharp(Buffer.from(svg), { density: 200 }).resize(w, h);
  if (args.format === "jpeg") {
    return img.jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  }
  return img.png({ compressionLevel: 9 }).toBuffer();
}
