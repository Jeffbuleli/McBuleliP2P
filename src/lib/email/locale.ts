import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale } from "@/i18n/locale";

export type EmailLocale = Locale;

export async function resolveEmailLocale(req?: Request): Promise<EmailLocale> {
  try {
    const jar = await cookies();
    const stored = jar.get(LOCALE_COOKIE)?.value;
    if (stored === "en" || stored === "fr") return stored;
  } catch {
    /* outside request context */
  }

  if (req) {
    const accept = req.headers.get("accept-language")?.toLowerCase() ?? "";
    if (accept.startsWith("fr")) return "fr";
    if (accept.startsWith("en")) return "en";
  }

  return "fr";
}

export function normalizeEmailLocale(value: unknown): EmailLocale {
  return value === "en" ? "en" : "fr";
}
