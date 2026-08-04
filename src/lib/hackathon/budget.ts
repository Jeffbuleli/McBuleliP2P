/**
 * Prévision budgétaire Hackathon Kinshasa - 28-29 août 2026.
 * Base partenaires : 2 places / org, hors SanJa, Binance, Silikin, pawaPay.
 */

export const HACKATHON_BUDGET_DAYS = 2;

/** Calendrier réservation Silikin (OfficeRnD). */
export const SILIKIN_BOOKING_URL =
  "https://silikinvillage.officernd.com/public/calendar/Auditorium?participants=1,41";

/** Salle 37 - OfficeRnD « Auditorium-Campus Salle 2 (Arrière) » - ~185,34-186 $/jour */
export const ROOM_37_USD_PER_DAY = 186;
export const ROOM_37_OFFICIAL_NAME =
  "Auditorium-Campus Salle 2 (Arrière)";
export const ROOM_37_INCLUDED: readonly string[] = [
  "Connexion internet",
  "Électricité",
  "Climatisation",
  "Mobilier",
  "Projecteur",
  "Soundbar",
  "Webcam",
  "Extincteur",
];

/** Salle 100 - OfficeRnD « Auditorium - Business Center » - ~560,34-561 $/jour */
export const ROOM_100_USD_PER_DAY = 561;
export const ROOM_100_OFFICIAL_NAME = "Auditorium - Business Center";
export const ROOM_100_INCLUDED: readonly string[] = [
  "Connexion internet",
  "Climatisation",
  "Mobilier",
  "Projecteur",
  "Installation sonore",
  "Extincteur",
];

export const ROOM_37_INCLUDED_EN: readonly string[] = [
  "Internet",
  "Power",
  "A/C",
  "Furniture",
  "Projector",
  "Soundbar",
  "Webcam",
  "Fire extinguisher",
];

export const ROOM_100_INCLUDED_EN: readonly string[] = [
  "Internet",
  "A/C",
  "Furniture",
  "Projector",
  "Sound system",
  "Fire extinguisher",
];

/** Déjeuner - USD / personne / jour */
export const LUNCH_USD_PER_PERSON_DAY = 20;
/** Pause café × 2 - USD / personne / jour */
export const PAUSE_USD_PER_PERSON_DAY = 2;

/** Caméraman - forfait 2 jours */
export const CAMERAMAN_USD = 150;
/** Marketing / diffusion - forfait */
export const MARKETING_USD = 100;

/** Ambassadeurs (codes promo actifs) + staff McBuleli */
export const AMBASSADOR_HEADCOUNT = 5;
export const MCBULELI_STAFF_HEADCOUNT = 2;
export const BUILDERS_TARGET_FULL = 100;

export type BudgetOrgKind =
  | "sponsor"
  | "jury"
  | "mentor"
  | "speaker"
  | "partner"
  | "media";

/** Orgs avec 2 badges (budget) - hors SanJa, Binance, Silikin, pawaPay. */
export const BUDGET_PARTNER_ORGS: ReadonlyArray<{
  slug: string;
  name: string;
  seats: 2;
  kind: BudgetOrgKind;
  /** Scène / pitch business (pas seulement mentorat silencieux). */
  talk: boolean;
  roleFr: string;
  roleEn: string;
  talkFr?: string;
  talkEn?: string;
}> = [
  {
    slug: "ilokwe",
    name: "ILOKWE GROUP",
    seats: 2,
    kind: "sponsor",
    talk: true,
    roleFr: "Sponsor Or · Jury · Talk · Mentorat",
    roleEn: "Gold sponsor · Jury · Talk · Mentoring",
    talkFr: "Talk / atelier rentabilité agricole",
    talkEn: "Talk / agri profitability workshop",
  },
  {
    slug: "rdpi",
    name: "RDPI Think Tank",
    seats: 2,
    kind: "jury",
    talk: true,
    roleFr: "Jury · Talk policy & impact",
    roleEn: "Jury · Policy & impact talk",
    talkFr: "Talk réglementation / impact",
    talkEn: "Policy / impact talk",
  },
  {
    slug: "kimia",
    name: "KIMIA Service",
    seats: 2,
    kind: "mentor",
    talk: false,
    roleFr: "Mentorat talents & employabilité",
    roleEn: "Talent & employability mentoring",
  },
  {
    slug: "montana-pay",
    name: "MontanaPay",
    seats: 2,
    kind: "speaker",
    talk: true,
    roleFr: "Talk FinTech / Escrow · Mentorat",
    roleEn: "FinTech / Escrow talk · Mentoring",
    talkFr: "Talk escrow & paiements",
    talkEn: "Escrow & payments talk",
  },
  {
    slug: "bienv-photography",
    name: "Bienv Photography",
    seats: 2,
    kind: "media",
    talk: false,
    roleFr: "Médias · photo & vidéo",
    roleEn: "Media · photo & video",
  },
  {
    slug: "kilelo",
    name: "Kilelo",
    seats: 2,
    kind: "speaker",
    talk: true,
    roleFr: "Talk Marketplace · Mentorat",
    roleEn: "Marketplace talk · Mentoring",
    talkFr: "Talk matching / confiance / avis",
    talkEn: "Matching / trust / reviews talk",
  },
  {
    slug: "tyts",
    name: "TYTS",
    seats: 2,
    kind: "mentor",
    talk: false,
    roleFr: "Mentorat tech · cyber / réseaux",
    roleEn: "Tech mentoring · cyber / networks",
  },
  {
    slug: "ia-academie-chk",
    name: "IA Académie / CHK",
    seats: 2,
    kind: "speaker",
    talk: true,
    roleFr: "Talk académique · vivier · atelier",
    roleEn: "Academic talk · talent pipeline · workshop",
    talkFr: "Talk / atelier IA & formation",
    talkEn: "AI & training talk / workshop",
  },
  {
    slug: "cesar-group",
    name: "César Group",
    seats: 2,
    kind: "speaker",
    talk: true,
    roleFr: "Talk formation & employabilité",
    roleEn: "Training & employability talk",
    talkFr: "Talk pitch / Office & employabilité",
    talkEn: "Pitch / Office & employability talk",
  },
  {
    slug: "e-com-sas",
    name: "e-COM SAS",
    seats: 2,
    kind: "partner",
    talk: true,
    roleFr: "Talk FinTech & e-paiement",
    roleEn: "FinTech & e-payments talk",
    talkFr: "Talk e-paiement / FinTech",
    talkEn: "E-payments / FinTech talk",
  },
];

export const BUDGET_EXCLUDED_ORGS: ReadonlyArray<{
  slug: string;
  name: string;
  reasonFr: string;
  reasonEn: string;
}> = [
  {
    slug: "sanja-service",
    name: "SanJa",
    reasonFr: "Partenaire sans intervention porte",
    reasonEn: "Partner without door badges",
  },
  {
    slug: "binance",
    name: "Binance",
    reasonFr: "Pas de badge sur site",
    reasonEn: "No on-site badge",
  },
  {
    slug: "silikin",
    name: "Silikin Village",
    reasonFr: "Lieu hôte - inclus location",
    reasonEn: "Host venue - included in room rental",
  },
  {
    slug: "pawapay",
    name: "pawaPay",
    reasonFr: "Pas de badge sur site",
    reasonEn: "No on-site badge",
  },
];

export const BUDGET_PARTNER_SEATS = BUDGET_PARTNER_ORGS.reduce(
  (n, o) => n + o.seats,
  0,
);

export const BUDGET_TALK_ORGS = BUDGET_PARTNER_ORGS.filter((o) => o.talk);

export type BudgetScenarioId = "room37" | "room100";

export type BudgetLine = {
  id: string;
  labelFr: string;
  labelEn: string;
  detailFr: string;
  detailEn: string;
  amountUsd: number;
};

export type BudgetSnapshot = {
  id: BudgetScenarioId;
  labelFr: string;
  labelEn: string;
  ledeFr: string;
  ledeEn: string;
  roomCapacity: number;
  roomUsdPerDay: number;
  roomOfficialName: string;
  roomIncludedFr: readonly string[];
  roomIncludedEn: readonly string[];
  builders: number;
  partners: number;
  ambassadors: number;
  staff: number;
  talkCount: number;
  headcount: number;
  exceedsRoom: boolean;
  foodPerPersonPerDay: number;
  lines: BudgetLine[];
  subtotalOpsUsd: number;
  totalUsd: number;
};

export type BudgetSuggestion = {
  id: string;
  labelFr: string;
  labelEn: string;
  whyFr: string;
  whyEn: string;
};

/** Postes souvent oubliés - hors avantages déjà inclus dans la location Silikin. */
export const BUDGET_SUGGESTIONS: readonly BudgetSuggestion[] = [
  {
    id: "prizes",
    labelFr: "Dotation / prix (cash ou nature)",
    labelEn: "Prize pool (cash or in-kind)",
    whyFr: "Motivation équipes + crédibilité Demo Day",
    whyEn: "Team motivation + Demo Day credibility",
  },
  {
    id: "internet-backup",
    labelFr: "Backup 4G / hotspot (complément)",
    labelEn: "4G / hotspot backup",
    whyFr: "Internet Silikin inclus - utile en secours si saturation Wi-Fi",
    whyEn: "Silikin Wi-Fi included - backup if the network saturates",
  },
  {
    id: "power-strips",
    labelFr: "Multiprises / rallonges",
    labelEn: "Power strips / extension cords",
    whyFr: "Électricité Silikin incluse - besoin de points de charge laptops",
    whyEn: "Venue power included - need more laptop charging points",
  },
  {
    id: "badges",
    labelFr: "Badges / impression / signalétique",
    labelEn: "Badges / print / signage",
    whyFr: "Accueil, scan, zones partenaires",
    whyEn: "Check-in, scan, partner zones",
  },
  {
    id: "water",
    labelFr: "Eau & boissons hors pause",
    labelEn: "Water & drinks beyond coffee breaks",
    whyFr: "Confort builders (chaleur Kinshasa)",
    whyEn: "Builder comfort (Kinshasa heat)",
  },
  {
    id: "transport",
    labelFr: "Transport staff / intervenants clés",
    labelEn: "Staff / key speaker transport",
    whyFr: "Ponctualité Demo Day & masterclass",
    whyEn: "On-time Demo Day & masterclass",
  },
  {
    id: "contingency",
    labelFr: "Imprévus (8-12 %)",
    labelEn: "Contingency (8-12%)",
    whyFr: "Buffer logistique & last-minute",
    whyEn: "Logistics buffer & last-minute needs",
  },
  {
    id: "cleaning",
    labelFr: "Nettoyage fin de journée",
    labelEn: "End-of-day cleaning",
    whyFr: "À confirmer si hors forfait salle",
    whyEn: "Confirm if outside the room package",
  },
];

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

export function foodUsdPerPersonDay(): number {
  return LUNCH_USD_PER_PERSON_DAY + PAUSE_USD_PER_PERSON_DAY;
}

export function buildBudgetScenario(args: {
  id: BudgetScenarioId;
  builders: number;
}): BudgetSnapshot {
  const partners = BUDGET_PARTNER_SEATS;
  const ambassadors = AMBASSADOR_HEADCOUNT;
  const staff = MCBULELI_STAFF_HEADCOUNT;
  const talkCount = BUDGET_TALK_ORGS.length;
  const builders = Math.max(0, Math.floor(args.builders));
  const headcount = builders + partners + ambassadors + staff;

  const isFull = args.id === "room100";
  const roomCapacity = isFull ? 100 : 37;
  const roomUsdPerDay = isFull ? ROOM_100_USD_PER_DAY : ROOM_37_USD_PER_DAY;
  const roomOfficialName = isFull
    ? ROOM_100_OFFICIAL_NAME
    : ROOM_37_OFFICIAL_NAME;
  const roomIncludedFr = isFull ? ROOM_100_INCLUDED : ROOM_37_INCLUDED;
  const roomIncludedEn = isFull ? ROOM_100_INCLUDED_EN : ROOM_37_INCLUDED_EN;
  const roomTotal = money(roomUsdPerDay * HACKATHON_BUDGET_DAYS);
  const foodDay = foodUsdPerPersonDay();
  const foodTotal = money(headcount * foodDay * HACKATHON_BUDGET_DAYS);

  const lines: BudgetLine[] = [
    {
      id: "room",
      labelFr: isFull
        ? "Location Auditorium Business Center (100)"
        : "Location Campus Salle 2 Arrière (37)",
      labelEn: isFull
        ? "Business Center Auditorium rental (100)"
        : "Campus Room 2 (rear) rental (37)",
      detailFr: `${roomOfficialName} · ${roomUsdPerDay} $ × ${HACKATHON_BUDGET_DAYS} jours`,
      detailEn: `${roomOfficialName} · $${roomUsdPerDay} × ${HACKATHON_BUDGET_DAYS} days`,
      amountUsd: roomTotal,
    },
    {
      id: "food",
      labelFr: "Restauration (déjeuner + pauses)",
      labelEn: "Catering (lunch + coffee breaks)",
      detailFr: `${headcount} pers. × ${foodDay} $/j × ${HACKATHON_BUDGET_DAYS} j (déj. ${LUNCH_USD_PER_PERSON_DAY} $ + pause ${PAUSE_USD_PER_PERSON_DAY} $)`,
      detailEn: `${headcount} people × $${foodDay}/day × ${HACKATHON_BUDGET_DAYS} days (lunch $${LUNCH_USD_PER_PERSON_DAY} + breaks $${PAUSE_USD_PER_PERSON_DAY})`,
      amountUsd: foodTotal,
    },
    {
      id: "cameraman",
      labelFr: "Caméraman",
      labelEn: "Cameraman",
      detailFr: "Forfait couverture 2 jours",
      detailEn: "2-day coverage package",
      amountUsd: CAMERAMAN_USD,
    },
    {
      id: "marketing",
      labelFr: "Marketing / diffusion",
      labelEn: "Marketing / outreach",
      detailFr: "Affiches, posts, relances",
      detailEn: "Posters, posts, follow-ups",
      amountUsd: MARKETING_USD,
    },
  ];

  const totalUsd = money(lines.reduce((s, l) => s + l.amountUsd, 0));

  return {
    id: args.id,
    labelFr: isFull ? "Scénario 100 builders" : "Scénario salle 37",
    labelEn: isFull ? "100-builders scenario" : "37-seat room scenario",
    ledeFr: isFull
      ? "Si l'édition atteint 100 builders confirmés - salle grande + restauration au complet."
      : "Effectif actuel (builders tenus + partenaires × 2 + ambassadeurs + McBuleli) - salle 37.",
    ledeEn: isFull
      ? "If the edition reaches 100 confirmed builders - large room + full catering."
      : "Current headcount (held builders + partners × 2 + ambassadors + McBuleli) - 37-seat room.",
    roomCapacity,
    roomUsdPerDay,
    roomOfficialName,
    roomIncludedFr,
    roomIncludedEn,
    builders,
    partners,
    ambassadors,
    staff,
    talkCount,
    headcount,
    exceedsRoom: headcount > roomCapacity,
    foodPerPersonPerDay: foodDay,
    lines,
    subtotalOpsUsd: money(CAMERAMAN_USD + MARKETING_USD),
    totalUsd,
  };
}

export function formatUsd(n: number, locale: "fr" | "en" = "fr"): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
