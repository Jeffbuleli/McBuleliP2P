export type EmbedKind =
  | "youtube"
  | "tiktok"
  | "twitter"
  | "facebook"
  | "instagram"
  | "telegram"
  | "linkedin"
  | "reddit"
  | "unknown";

export type ParsedEmbed = {
  kind: EmbedKind;
  embedUrl: string | null;
  externalUrl: string;
  label: string;
  thumbnailUrl: string | null;
};

const URL_RE =
  /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,10}\b(?:[-a-zA-Z0-9@:%_+.~#?&/=]*)/gi;

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_RE);
  return matches ? [...new Set(matches)] : [];
}

export function extractHashtags(text: string): string[] {
  const tags = new Set<string>();
  for (const m of text.matchAll(/#([\p{L}\p{N}_]{2,40})/gu)) {
    tags.add(m[1]!.toLowerCase());
  }
  return [...tags];
}

function isPlayableEmbed(p: ParsedEmbed): boolean {
  return Boolean(p.embedUrl);
}

export function parseEmbedUrl(raw: string): ParsedEmbed | null {
  let url = raw.trim();
  try {
    url = new URL(url).toString();
  } catch {
    return null;
  }

  const yt =
    url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    )?.[1] ??
    url.match(/youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/)?.[1];
  if (yt) {
    return {
      kind: "youtube",
      embedUrl: `https://www.youtube.com/embed/${yt}?rel=0&playsinline=1`,
      externalUrl: url,
      label: "YouTube",
      thumbnailUrl: `https://img.youtube.com/vi/${yt}/hqdefault.jpg`,
    };
  }

  const tiktok =
    url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/)?.[1] ??
    url.match(/tiktok\.com\/(?:embed\/v2\/|video\/)(\d+)/)?.[1];
  if (tiktok) {
    return {
      kind: "tiktok",
      embedUrl: `https://www.tiktok.com/embed/v2/${tiktok}`,
      externalUrl: url,
      label: "TikTok",
      thumbnailUrl: null,
    };
  }
  if (/vm\.tiktok\.com|vt\.tiktok\.com/i.test(url)) {
    return {
      kind: "tiktok",
      embedUrl: null,
      externalUrl: url,
      label: "TikTok",
      thumbnailUrl: null,
    };
  }

  const tweet = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/)?.[1];
  if (tweet) {
    return {
      kind: "twitter",
      embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${tweet}&theme=light`,
      externalUrl: url,
      label: "X",
      thumbnailUrl: null,
    };
  }

  const ig =
    url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/)?.[1];
  if (ig || /instagram\.com/i.test(url)) {
    return {
      kind: "instagram",
      embedUrl: ig ? `https://www.instagram.com/p/${ig}/embed` : null,
      externalUrl: url,
      label: "Instagram",
      thumbnailUrl: null,
    };
  }

  const tgPost = url.match(/t\.me\/(?:c\/)?([\w]+)\/(\d+)/);
  if (tgPost) {
    const channel = tgPost[1]!;
    const msgId = tgPost[2]!;
    return {
      kind: "telegram",
      embedUrl: `https://t.me/${channel}/${msgId}?embed=1`,
      externalUrl: url,
      label: "Telegram",
      thumbnailUrl: null,
    };
  }
  if (/t\.me\/[\w]+/i.test(url)) {
    return {
      kind: "telegram",
      embedUrl: null,
      externalUrl: url,
      label: "Telegram",
      thumbnailUrl: null,
    };
  }

  if (/facebook\.com|fb\.watch|fb\.com/i.test(url)) {
    const encoded = encodeURIComponent(url);
    const isVideo = /\/videos\/|fb\.watch|\/reel\//i.test(url);
    return {
      kind: "facebook",
      embedUrl: isVideo
        ? `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&width=560`
        : `https://www.facebook.com/plugins/post.php?href=${encoded}&show_text=true&width=560`,
      externalUrl: url,
      label: "Facebook",
      thumbnailUrl: null,
    };
  }

  if (/linkedin\.com\/(posts|feed|pulse)/i.test(url)) {
    return {
      kind: "linkedin",
      embedUrl: null,
      externalUrl: url,
      label: "LinkedIn",
      thumbnailUrl: null,
    };
  }

  if (/reddit\.com\/r\//i.test(url)) {
    return {
      kind: "reddit",
      embedUrl: null,
      externalUrl: url,
      label: "Reddit",
      thumbnailUrl: null,
    };
  }

  return {
    kind: "unknown",
    embedUrl: null,
    externalUrl: url,
    label: "Link",
    thumbnailUrl: null,
  };
}

/** Prefer playable embeds; otherwise known network link cards. */
export function findEmbeddableUrl(text: string): ParsedEmbed | null {
  const urls = extractUrls(text);
  let fallback: ParsedEmbed | null = null;
  for (const u of urls) {
    const parsed = parseEmbedUrl(u);
    if (!parsed) continue;
    if (isPlayableEmbed(parsed)) return parsed;
    if (!fallback && parsed.kind !== "unknown") {
      fallback = parsed;
    }
  }
  return fallback;
}

/** Retire les URLs affichées en lecteur / carte réseau. */
export function stripEmbeddableUrls(text: string): string {
  let result = text;
  for (const u of extractUrls(text)) {
    const parsed = parseEmbedUrl(u);
    if (parsed && parsed.kind !== "unknown") {
      result = result.split(u).join(" ");
    }
  }
  return result.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Texte fil : masque les URLs remplacées par un embed / carte. */
export function postDisplayText(
  body: string,
  _opts?: { hasMedia?: boolean },
): string {
  if (!findEmbeddableUrl(body)) return body;
  return stripEmbeddableUrls(body);
}

export function telegramShareUrl(args: {
  url: string;
  text?: string;
}): string {
  const q = new URLSearchParams({ url: args.url });
  if (args.text?.trim()) q.set("text", args.text.trim().slice(0, 200));
  return `https://t.me/share/url?${q}`;
}
