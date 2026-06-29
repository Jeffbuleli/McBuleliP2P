import type { AboutPageCopy } from "@/lib/about-page-copy";
import { normalizeAboutPageCopy } from "@/lib/about-page-copy";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/i18n/locale";

/** Em dash reads like AI copy - use ASCII hyphen in UI strings. */
function dash(text: string): string {
  return text.replace(/\s-\s/g, " - ").replace(/-/g, "-");
}

export function buildAboutFuturisticCopy(locale: Locale, d: Messages): AboutPageCopy {
  const fr = locale === "fr";

  return normalizeAboutPageCopy({
    brand: d.brand,
    title: dash(d.legal_about_title),
    lead: dash(d.legal_about_lead),
    eyebrow: fr ? "Fintech Afrique · McBuleli" : "Africa Fintech · McBuleli",
    pillarsLabel: fr ? "Points clés" : "Key points",
    backHome: dash(d.auth_back_home),
    items: [
      dash(d.legal_about_1),
      dash(d.legal_about_2),
      dash(d.legal_about_3),
      dash(d.legal_about_4),
    ],
    footer: {
      about: d.landing_footer_about,
      contact: d.landing_footer_contact,
      terms: d.landing_footer_terms,
      privacy: d.landing_footer_privacy,
    },
  });
}
