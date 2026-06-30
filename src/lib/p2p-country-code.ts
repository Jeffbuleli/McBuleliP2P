import { P2P_COUNTRY_CODES, type P2pCountryCode } from "@/lib/p2p-config";

/** Values that must not be used as ISO country codes for P2P matching. */
const INVALID_PLACEHOLDERS = new Set([
  "",
  "-",
  "—",
  "–",
  "_",
  ".",
  "/",
  "\\",
  "NA",
  "N/A",
  "NULL",
  "NONE",
]);

/**
 * Maps stored `users.country_code` (or URL params) to a valid P2P corridor code.
 * Pi-only accounts often had null/invalid country; empty string `?? "CD"` was not enough
 * because `""` is not null and would not fall back.
 */
export function effectiveP2pCountryCode(
  raw: string | null | undefined,
  fallback: P2pCountryCode = "CD",
): P2pCountryCode {
  const t = (raw ?? "").trim();
  const u = t.toUpperCase();
  if (!t || INVALID_PLACEHOLDERS.has(t) || INVALID_PLACEHOLDERS.has(u)) {
    return fallback;
  }
  if (u === "OTHER") return "OTHER";
  if (u.length === 2 && /^[A-Z]{2}$/.test(u)) {
    if ((P2P_COUNTRY_CODES as readonly string[]).includes(u)) {
      return u as P2pCountryCode;
    }
  }
  return fallback;
}
