/** Anti-scam / anti-spam heuristics for Community DMs. */

const SCAM_KEYWORDS = [
  "double your",
  "guaranteed profit",
  "guaranteed return",
  "send usdt first",
  "whatsapp only",
  "telegram only",
  "investment scheme",
  "ponzi",
  "doublez votre",
  "gagnez 100%",
  "rendement garanti",
  "envoyez d'abord",
  "crypto giveaway",
  "free bitcoin",
  "seed phrase",
  "private key",
  "phrase de récupération",
  "clé privée",
  "wallet connect",
  "airdrop claim",
  "pump and dump",
  "to the moon 1000x",
  "dm for signal",
  "signaux vip payants",
  "récupération de fonds",
  "fund recovery",
  "nude",
  "onlyfans",
  "sex tape",
];

const SUSPICIOUS_TLDS = [".tk", ".ml", ".ga", ".cf", ".gq", ".top", ".xyz"];

const URL_RE =
  /https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|[a-z0-9-]+\.(tk|ml|ga|cf|gq|top|xyz|ru|cn)\b/gi;

export type DmModerationResult = {
  allowed: boolean;
  hidden: boolean;
  reason?: string;
  sanitizedBody: string;
};

export function moderateDmText(body: string): DmModerationResult {
  const trimmed = body.trim();
  if (!trimmed) {
    return { allowed: false, hidden: false, reason: "empty", sanitizedBody: "" };
  }

  const lower = trimmed.toLowerCase();
  for (const kw of SCAM_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        allowed: false,
        hidden: true,
        reason: "scam_keyword",
        sanitizedBody: trimmed,
      };
    }
  }

  const urls = trimmed.match(URL_RE) ?? [];
  for (const raw of urls) {
    const u = raw.toLowerCase();
    if (SUSPICIOUS_TLDS.some((tld) => u.includes(tld))) {
      return {
        allowed: false,
        hidden: true,
        reason: "malicious_link",
        sanitizedBody: redactLinks(trimmed),
      };
    }
  }

  return { allowed: true, hidden: false, sanitizedBody: trimmed };
}

function redactLinks(text: string): string {
  return text.replace(URL_RE, "[lien masqué]");
}

/** In-memory rate limit — per user per minute. */
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function checkDmRateLimit(userId: string, maxPerMinute = 25): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(userId);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (bucket.count >= maxPerMinute) return false;
  bucket.count += 1;
  return true;
}
