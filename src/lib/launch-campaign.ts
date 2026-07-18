/** McBuleli official launch — online academy campaign (Jun 2026). */

export const LAUNCH_WEBINAR_ISO = "2026-06-08T18:00:00.000Z"; // 19:00 GMT+1
export const TRAINING_START = "2026-06-15";
export const TRAINING_END = "2026-06-30";
export const TRAINING_SLOT = "18:30–20:00";
export const TRAINING_WEEKDAYS = "saturday" as const;

export const FORMATION_PATH = "/formation";
export const PORTRAIT_PATH = "/launch/jeff-portrait-v2.png";

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
      eyebrow: "Lancement officiel · McBuleli",
      title: "Formation en ligne",
      subtitle: "Crypto · Trading · IA · P2P",
      dateLine: "8 juin 2026 · 19h (GMT+1)",
      topics: ["Crypto", "Trading", "IA", "P2P"],
      cta: "S'inscrire gratuitement",
      trainingLine: `15–30 juin · chaque samedi ${TRAINING_SLOT}`,
      freeBadge: "Gratuit · 2 semaines",
    };
  }
  return {
    eyebrow: "Official launch · McBuleli",
    title: "Online training",
    subtitle: "Crypto · Trading · AI · P2P",
    dateLine: "8 June 2026 · 7 PM (GMT+1)",
    topics: ["Crypto", "Trading", "AI", "P2P"],
    cta: "Register free",
    trainingLine: `15–30 June · every Saturday ${TRAINING_SLOT}`,
    freeBadge: "Free · 2 weeks",
  };
}
