/**
 * Partner day brief (28 Aug) — talk slot, what to bring, practical session.
 * Shown in /hackathon chat → Préparation.
 * César / e-COM : hors scène (sans retour) — KIMIA & TYTS retenus.
 */

export type PartnerTalkStatus =
  | "confirmed"
  | "pending_24h"
  | "backup"
  | "media_only"
  | "none";

export type PartnerTalkSlot = {
  start: string;
  end: string;
  domainFr: string;
  domainEn: string;
  status: PartnerTalkStatus;
  /** Shown when pending / backup / media */
  noteFr?: string;
  noteEn?: string;
};

export type PartnerDayBrief = {
  dateLabelFr: string;
  dateLabelEn: string;
  teamFr: string;
  teamEn: string;
  /** Arrival / setup — all partners */
  setupFr: string;
  setupEn: string;
  talk: PartnerTalkSlot | null;
  bringTechFr: readonly string[];
  bringTechEn: readonly string[];
  bringVisibilityFr: readonly string[];
  bringVisibilityEn: readonly string[];
  bootcampTitleFr: string;
  bootcampTitleEn: string;
  bootcampFr: string;
  bootcampEn: string;
};

const DATE_FR = "Vendredi 28 août 2026";
const DATE_EN = "Friday 28 August 2026";

const BRING_TECH_FR = [
  "Laptop + chargeur",
  "Agent IA : cursor.com recommandé (autre outil libre)",
  "GitHub connecté",
  "Hotspot de secours",
] as const;

const BRING_TECH_EN = [
  "Laptop + charger",
  "AI agent: cursor.com recommended (any tool is fine)",
  "GitHub signed in",
  "Backup hotspot",
] as const;

const BRING_VIS_FR = [
  "Kakemono / roll-up si déjà dispo",
  "3 slides max + logo HD",
  "QR site / WhatsApp / produit",
  "Cartes de visite ou QR papier",
  "Polo logo (idéal)",
] as const;

const BRING_VIS_EN = [
  "Roll-up if you already have one",
  "3 slides max + HD logo",
  "QR to site / WhatsApp / product",
  "Business cards or paper QR",
  "Logo polo (ideal)",
] as const;

/** Talk length after redistributing time from a 1h bootcamp. */
export const PARTNER_TALK_MINUTES = 10;

/** Shared day blocks (Kinshasa) — used by programme, not in partner copy. */
export const DAY1_BOOTCAMP = { start: "10:30", end: "11:30" } as const;
export const DAY1_PARTNER_VITRINE = { start: "09:10", end: "10:20" } as const;
export const DAY1_SETUP = { start: "08:00", end: "08:30" } as const;

const SETUP_FR =
  "Arrivée 8h00 pour la mise en place de votre visibilité (kakemono, logo, cartes).";
const SETUP_EN =
  "Arrive 8:00 AM to set up your visibility (roll-up, logo, cards).";

const BOOTCAMP_FR =
  "Moment pratique pour tester un agent IA et croiser vos expériences. Notre recommandation : cursor.com — chacun reste libre de son outil. Idéal : 1 représentant + 1 profil IT.";

const BOOTCAMP_EN =
  "Hands-on time to try an AI agent and share experience. Our recommendation: cursor.com — you may use any tool you prefer. Ideal: 1 representative + 1 IT profile.";

const BOOTCAMP_TITLE_FR = "Session pratique";
const BOOTCAMP_TITLE_EN = "Hands-on session";

/** Per-org talk window (domain order) — 10 min each. Active partners only. */
const TALK_BY_SLUG: Record<string, PartnerTalkSlot> = {
  rdpi: {
    start: "09:10",
    end: "09:20",
    domainFr: "Cadre & impact",
    domainEn: "Policy & impact",
    status: "confirmed",
  },
  "ia-academie-chk": {
    start: "09:20",
    end: "09:30",
    domainFr: "Formation IA",
    domainEn: "AI training",
    status: "confirmed",
  },
  kimia: {
    start: "09:30",
    end: "09:40",
    domainFr: "Formation & employabilité",
    domainEn: "Training & employability",
    status: "confirmed",
  },
  "montana-pay": {
    start: "09:40",
    end: "09:50",
    domainFr: "FinTech / escrow",
    domainEn: "FinTech / escrow",
    status: "confirmed",
  },
  tyts: {
    start: "09:50",
    end: "10:00",
    domainFr: "Tech / cyber & réseaux",
    domainEn: "Tech / cyber & networks",
    status: "confirmed",
  },
  kilelo: {
    start: "10:00",
    end: "10:10",
    domainFr: "Marketplace & confiance",
    domainEn: "Marketplace & trust",
    status: "confirmed",
  },
  ilokwe: {
    start: "10:10",
    end: "10:20",
    domainFr: "Agro · Sponsor Or",
    domainEn: "Agri · Gold sponsor",
    status: "confirmed",
  },
  /** Sans retour — hors vitrine scène. */
  "cesar-group": {
    start: "",
    end: "",
    domainFr: "Formation & employabilité",
    domainEn: "Training & employability",
    status: "none",
  },
  "e-com-sas": {
    start: "",
    end: "",
    domainFr: "FinTech / e-paiement",
    domainEn: "FinTech / e-payments",
    status: "none",
  },
  "bienv-photography": {
    start: "08:00",
    end: "08:30",
    domainFr: "Médias · mise en place",
    domainEn: "Media · setup",
    status: "media_only",
    noteFr: "1 place. Couverture photo/vidéo — pas d'intervention scène.",
    noteEn: "1 seat. Photo/video coverage — no stage talk.",
  },
};

const BIENV_BRING_TECH_FR = [
  "Matériel photo / vidéo + batteries",
  "Cartes mémoire / stockage",
  "Trépied si besoin",
] as const;

const BIENV_BRING_TECH_EN = [
  "Photo / video gear + batteries",
  "Memory cards / storage",
  "Tripod if needed",
] as const;

const BIENV_BRING_VIS_FR = [
  "Logo HD + kakemono / roll-up",
  "Cartes de visite ou QR",
  "Polo / badge logo",
  "Supports pour angle de vue (fond / spot si dispo)",
] as const;

const BIENV_BRING_VIS_EN = [
  "HD logo + roll-up",
  "Business cards or QR",
  "Logo polo / badge",
  "Background / spot supports if available",
] as const;

export function partnerDayBriefForSlug(slug: string): PartnerDayBrief {
  const talk = TALK_BY_SLUG[slug] ?? null;

  if (slug === "bienv-photography") {
    return {
      dateLabelFr: DATE_FR,
      dateLabelEn: DATE_EN,
      teamFr: "1 place — photographe de l'événement",
      teamEn: "1 seat — event photographer",
      setupFr: SETUP_FR,
      setupEn: SETUP_EN,
      talk,
      bringTechFr: BIENV_BRING_TECH_FR,
      bringTechEn: BIENV_BRING_TECH_EN,
      bringVisibilityFr: BIENV_BRING_VIS_FR,
      bringVisibilityEn: BIENV_BRING_VIS_EN,
      bootcampTitleFr: "Couverture média",
      bootcampTitleEn: "Media coverage",
      bootcampFr:
        "Vous documentez la journée (photo / vidéo). Pas d'intervention scène.",
      bootcampEn:
        "You cover the day (photo / video). No stage talk.",
    };
  }

  return {
    dateLabelFr: DATE_FR,
    dateLabelEn: DATE_EN,
    teamFr: "2 places : idéalement 1 représentant + 1 IT",
    teamEn: "2 seats: ideally 1 representative + 1 IT",
    setupFr: SETUP_FR,
    setupEn: SETUP_EN,
    talk,
    bringTechFr: BRING_TECH_FR,
    bringTechEn: BRING_TECH_EN,
    bringVisibilityFr: BRING_VIS_FR,
    bringVisibilityEn: BRING_VIS_EN,
    bootcampTitleFr: BOOTCAMP_TITLE_FR,
    bootcampTitleEn: BOOTCAMP_TITLE_EN,
    bootcampFr: BOOTCAMP_FR,
    bootcampEn: BOOTCAMP_EN,
  };
}
