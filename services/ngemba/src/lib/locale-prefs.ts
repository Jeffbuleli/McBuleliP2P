import { isLocale, type Locale } from "@/lib/i18n";

export const LOCALE_STORAGE_KEY = "ngemba_locale";

export function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    return raw && isLocale(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore quota / private mode
  }
}

/** URL ?lang= prioritaire, sinon preference appareil, sinon fr. */
export function resolveLocale(urlLang?: string | null): Locale {
  if (urlLang && isLocale(urlLang)) return urlLang;
  const stored = readStoredLocale();
  if (stored) return stored;
  return "fr";
}

export function withLang(path: string, locale: Locale): string {
  const base = path.split("?")[0] || "/";
  return `${base}?lang=${locale}`;
}
