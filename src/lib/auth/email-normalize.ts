/**
 * Auth email normalization — prevents duplicate accounts via case, Gmail aliases, and common domain typos.
 */

const GMAIL_LIKE = new Set(["gmail.com", "googlemail.com"]);

/** Common typos → intended domain (lowercase). */
const DOMAIN_TYPO_FIX: Record<string, string> = {
  "gmail.coom": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.co": "gmail.com",
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gnail.com": "gmail.com",
  "googlemail.co": "gmail.com",
  "hotmail.coom": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "yahoo.coom": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "outlook.coom": "outlook.com",
  "outlook.con": "outlook.com",
};

export function normalizeAuthEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function splitEmail(email: string): { local: string; domain: string } | null {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return null;
  return {
    local: email.slice(0, at),
    domain: email.slice(at + 1),
  };
}

/** Fix known domain typos (gmail.coom → gmail.com). */
export function fixKnownEmailDomainTypo(email: string): {
  email: string;
  fixed: boolean;
  fromDomain?: string;
} {
  const normalized = normalizeAuthEmail(email);
  const parts = splitEmail(normalized);
  if (!parts) return { email: normalized, fixed: false };

  const target = DOMAIN_TYPO_FIX[parts.domain];
  if (!target || target === parts.domain) {
    return { email: normalized, fixed: false };
  }
  return {
    email: `${parts.local}@${target}`,
    fixed: true,
    fromDomain: parts.domain,
  };
}

/** Canonical key for dedup (Gmail: ignore dots & +tags). */
export function canonicalEmailForDedup(email: string): string {
  const { email: typoFixed } = fixKnownEmailDomainTypo(email);
  const parts = splitEmail(typoFixed);
  if (!parts) return typoFixed;

  let { local, domain } = parts;
  if (domain === "googlemail.com") domain = "gmail.com";

  if (GMAIL_LIKE.has(domain)) {
    const plus = local.indexOf("+");
    if (plus >= 0) local = local.slice(0, plus);
    local = local.replace(/\./g, "");
  }

  return `${local}@${domain}`;
}

export function isRetiredOrSystemEmail(email: string): boolean {
  const e = normalizeAuthEmail(email);
  return (
    e.endsWith("@deleted.mcbuleli.org") ||
    e.endsWith("@pi.local") ||
    e.startsWith("retired+")
  );
}

/** Levenshtein distance for short domain strings. */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return dp[n];
}

const SIMILAR_DOMAIN_MAX_DISTANCE = 2;

/**
 * True when domain looks like a typo of a known provider (e.g. gmail.coom vs gmail.com).
 * Used only when canonical keys differ but local parts match.
 */
export function domainsAreSuspiciouslySimilar(a: string, b: string): boolean {
  if (a === b) return false;
  if (DOMAIN_TYPO_FIX[a] === b || DOMAIN_TYPO_FIX[b] === a) return true;
  const aBase = a.split(".").slice(-2).join(".");
  const bBase = b.split(".").slice(-2).join(".");
  if (aBase === bBase) return editDistance(a, b) <= SIMILAR_DOMAIN_MAX_DISTANCE;
  return editDistance(a, b) <= SIMILAR_DOMAIN_MAX_DISTANCE;
}

export function suggestEmailTypoFix(email: string): string | null {
  const fixed = fixKnownEmailDomainTypo(email);
  if (fixed.fixed) return fixed.email;
  return null;
}
