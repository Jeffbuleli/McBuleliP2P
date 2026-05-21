const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Payload encoded in profile QR for internal wallet send. */
export function walletPayUri(userId: string): string {
  return `mcbuleli://pay/${userId.trim()}`;
}

/** Parse pasted text or scanned QR into a user UUID. */
export function parseWalletPayRecipient(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const fromScheme = t.match(/mcbuleli:\/\/pay\/([0-9a-f-]{36})/i);
  if (fromScheme?.[1] && UUID_RE.test(fromScheme[1])) return fromScheme[1].toLowerCase();
  if (UUID_RE.test(t)) return t.toLowerCase();
  return null;
}
