/** McBuleli official launch - online academy campaign (Jun 2026). */

export const LAUNCH_WEBINAR_ISO = "2026-07-04T16:30:00.000Z"; // 18:30 GMT+1
export const TRAINING_START = "2026-07-04";
export const TRAINING_END = "2026-07-25";
export const TRAINING_SLOT = "18:30-20:00";
export const TRAINING_WEEKDAYS = "saturday" as const;

export const FORMATION_PATH = "/formation";
export const PORTRAIT_PATH = "/launch/jeff-portrait.png";

export function formationUrl(params?: Record<string, string>): string {
  const base = FORMATION_PATH;
  if (!params || Object.keys(params).length === 0) return base;
  const q = new URLSearchParams(params);
  return `${base}?${q.toString()}`;
}

export function formationBroadcastCta(locale: "fr" | "en"): string {
  const p = new URLSearchParams({
    utm_source: "email",
    utm_medium: "broadcast",
    utm_campaign: "launch_academy",
    lang: locale,
  });
  return `https://mcbuleli.org${FORMATION_PATH}?${p.toString()}`;
}

export function launchCampaignEnabled(): boolean {
  const off = process.env.NEXT_PUBLIC_LAUNCH_CAMPAIGN?.trim().toLowerCase();
  if (off === "false" || off === "0") return false;
  return true;
}

export type LaunchCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  dateLine: string;
  topics: string[];
  cta: string;
  trainingLine: string;
  freeBadge: string;
};

export function launchCopy(locale: "fr" | "en"): LaunchCopy {
  if (locale === "fr") {
    return {
      eyebrow: "Programme juillet · McBuleli Academy",
      title: "Formation en ligne",
      subtitle: "Crypto · Trading · IA · P2P",
      dateLine: `Chaque samedi de juillet · ${TRAINING_SLOT} (GMT+1)`,
      topics: ["Crypto", "Trading", "IA", "P2P"],
      cta: "S'inscrire gratuitement",
      trainingLine: "4, 11, 18 & 25 juillet · sessions live · accès gratuit",
      freeBadge: "Gratuit · juillet 2026",
    };
  }
  return {
    eyebrow: "July program · McBuleli Academy",
    title: "Online training",
    subtitle: "Crypto · Trading · AI · P2P",
    dateLine: `Every Saturday in July · ${TRAINING_SLOT} (GMT+1)`,
    topics: ["Crypto", "Trading", "AI", "P2P"],
    cta: "Register free",
    trainingLine: "Jul 4, 11, 18 & 25 · live sessions · free access",
    freeBadge: "Free · July 2026",
  };
}
