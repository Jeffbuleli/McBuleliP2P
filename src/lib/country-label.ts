import type { Locale } from "@/i18n/locale";

function flagEmoji(countryCode: string): string {
  const cc = countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "🏳️";
  const base = 0x1f1e6;
  const a = cc.charCodeAt(0) - 65;
  const b = cc.charCodeAt(1) - 65;
  return String.fromCodePoint(base + a, base + b);
}

export function countryLabel(locale: Locale, countryCode: string): string {
  const cc = (countryCode ?? "").trim().toUpperCase();
  if (!cc) return "—";
  if (cc === "OTHER") {
    const name = locale === "fr" ? "Autre" : "Other";
    return `🏳️ ${name} (OTHER)`;
  }

  // Prefer full name via Intl.DisplayNames when available.
  let name: string | null = null;
  try {
    // Map our app locales to ICU locale tags.
    const tag = locale === "fr" ? "fr" : "en";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DisplayNames = (Intl as any).DisplayNames as
      | (new (locales: string | string[], options: { type: string }) => {
          of: (code: string) => string | undefined;
        })
      | undefined;
    if (DisplayNames) {
      const dn = new DisplayNames(tag, { type: "region" });
      const n = dn.of(cc);
      if (n && n.toUpperCase() !== cc) name = n;
    }
  } catch {
    /* ignore */
  }

  // Minimal fallback for common region codes in our market.
  if (!name) {
    const fallback: Record<string, { en: string; fr: string }> = {
      CD: { en: "DR Congo", fr: "RDC" },
      CG: { en: "Congo", fr: "Congo" },
      RW: { en: "Rwanda", fr: "Rwanda" },
      UG: { en: "Uganda", fr: "Ouganda" },
      KE: { en: "Kenya", fr: "Kenya" },
      TZ: { en: "Tanzania", fr: "Tanzanie" },
      BI: { en: "Burundi", fr: "Burundi" },
      CM: { en: "Cameroon", fr: "Cameroun" },
      NG: { en: "Nigeria", fr: "Nigéria" },
      GH: { en: "Ghana", fr: "Ghana" },
      ZA: { en: "South Africa", fr: "Afrique du Sud" },
      SN: { en: "Senegal", fr: "Sénégal" },
      CI: { en: "Côte d’Ivoire", fr: "Côte d’Ivoire" },
    };
    const lang = locale === "fr" ? "fr" : "en";
    name = fallback[cc]?.[lang] ?? cc;
  }

  return `${flagEmoji(cc)} ${name} (${cc})`;
}

