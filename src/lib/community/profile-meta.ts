export type CommunityProfileMeta = {
  copyTradingEnabled?: boolean;
  showBotLeaderboard?: boolean;
  botTemplatesPublished?: number;
  profitSharePct?: number;
  /** City / region shown on public profile. */
  location?: string;
  website?: string;
  x?: string;
  facebook?: string;
  tiktok?: string;
  whatsapp?: string;
  telegram?: string;
};

export type CommunityProfileLinks = {
  location: string | null;
  website: string | null;
  x: string | null;
  facebook: string | null;
  tiktok: string | null;
  whatsapp: string | null;
  telegram: string | null;
};

function asTrimmed(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim().slice(0, max);
  return s || undefined;
}

export function parseCommunityProfileMeta(raw: unknown): CommunityProfileMeta {
  if (!raw || typeof raw !== "object") return {};
  const m = raw as Record<string, unknown>;
  return {
    copyTradingEnabled: m.copyTradingEnabled === true,
    showBotLeaderboard: m.showBotLeaderboard === true,
    botTemplatesPublished:
      typeof m.botTemplatesPublished === "number"
        ? m.botTemplatesPublished
        : undefined,
    profitSharePct:
      typeof m.profitSharePct === "number" ? m.profitSharePct : undefined,
    location: asTrimmed(m.location, 80),
    website: asTrimmed(m.website, 200),
    x: asTrimmed(m.x, 120),
    facebook: asTrimmed(m.facebook, 200),
    tiktok: asTrimmed(m.tiktok, 120),
    whatsapp: asTrimmed(m.whatsapp, 32),
    telegram: asTrimmed(m.telegram, 64),
  };
}

export function mergeCommunityProfileMeta(
  existing: unknown,
  patch: Partial<CommunityProfileMeta>,
): CommunityProfileMeta {
  const base = parseCommunityProfileMeta(existing);
  const next: CommunityProfileMeta = { ...base, ...patch };
  for (const key of [
    "location",
    "website",
    "x",
    "facebook",
    "tiktok",
    "whatsapp",
    "telegram",
  ] as const) {
    if (key in patch && (patch[key] === "" || patch[key] === null)) {
      delete next[key];
    }
  }
  return next;
}

export function linksFromMeta(meta: CommunityProfileMeta): CommunityProfileLinks {
  return {
    location: meta.location ?? null,
    website: meta.website ?? null,
    x: meta.x ?? null,
    facebook: meta.facebook ?? null,
    tiktok: meta.tiktok ?? null,
    whatsapp: meta.whatsapp ?? null,
    telegram: meta.telegram ?? null,
  };
}

/** Normalize public URL or return null if unsafe. */
export function normalizeProfileWebsite(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString().slice(0, 200);
  } catch {
    return null;
  }
}

export function normalizeProfileHandle(raw: string, max = 64): string | null {
  const s = raw.trim().replace(/^@/, "").slice(0, max);
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      return u.toString().slice(0, 200);
    } catch {
      return null;
    }
  }
  if (!/^[a-zA-Z0-9._/-]{1,64}$/.test(s)) return null;
  return s;
}

export function normalizeWhatsapp(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "").slice(0, 20);
  if (digits.replace(/\D/g, "").length < 8) return null;
  return digits;
}

export function profileLinkHref(
  kind: keyof Omit<CommunityProfileLinks, "location">,
  value: string,
): string {
  if (/^https?:\/\//i.test(value)) return value;
  switch (kind) {
    case "website":
      return normalizeProfileWebsite(value) ?? "#";
    case "x":
      return `https://x.com/${value.replace(/^@/, "")}`;
    case "facebook":
      return `https://facebook.com/${value}`;
    case "tiktok":
      return `https://www.tiktok.com/@${value.replace(/^@/, "")}`;
    case "whatsapp":
      return `https://wa.me/${value.replace(/\D/g, "")}`;
    case "telegram":
      return `https://t.me/${value.replace(/^@/, "")}`;
    default:
      return "#";
  }
}
