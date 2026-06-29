/** Community handle - lettres, chiffres, underscore ; suffixe _2, _3 si collision. */

const HANDLE_RE = /^[a-z][a-z0-9_]{2,31}$/;

export function normalizeUsernameBase(raw: string): string {
  const clean = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]+/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
  if (clean.length >= 3) return clean;
  return "user";
}

export function isValidCommunityHandle(handle: string): boolean {
  return HANDLE_RE.test(handle);
}

/** Ancien format : base + fragment uuid (ex. ceocf67b3). */
export function isLegacyGarbageHandle(
  handle: string,
  displayName: string,
): boolean {
  const base = normalizeUsernameBase(displayName);
  if (handle === base) return false;
  if (/^user_\d+$/.test(handle)) return false;
  if (/^user[a-f0-9]{4,}$/i.test(handle)) return true;
  if (handle.startsWith(base) && handle.length > base.length) {
    const tail = handle.slice(base.length);
    if (/^[a-f0-9]{4,8}$/i.test(tail)) return true;
  }
  return false;
}

export function candidateHandle(base: string, attempt: number): string {
  const root = normalizeUsernameBase(base);
  if (attempt <= 0) return root;
  return `${root}_${attempt + 1}`;
}
