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

/** Orgs avec 2 badges (budget) - hors SanJa, Binance, Silikin, pawaPay. */
export const BUDGET_PARTNER_ORGS: ReadonlyArray<{
  slug: string;
  name: string;
  seats: 2;
  role: string;
}> = [
  { slug: "ilokwe", name: "ILOKWE GROUP", seats: 2, role: "Sponsor / jury" },
  { slug: "rdpi", name: "RDPI Think Tank", seats: 2, role: "Jury" },
  { slug: "kimia", name: "KIMIA Service", seats: 2, role: "Mentorat" },
  { slug: "montana-pay", name: "MontanaPay", seats: 2, role: "Talk / FinTech" },
  { slug: "bienv-photography", name: "Bienv Photography", seats: 2, role: "Médias" },
  { slug: "kilelo", name: "Kilelo", seats: 2, role: "Speaker" },
  { slug: "tyts", name: "TYTS", seats: 2, role: "Mentorat tech" },
  { slug: "ia-academie-chk", name: "IA Académie / CHK", seats: 2, role: "Académique" },
  { slug: "cesar-group", name: "César Group", seats: 2, role: "Speaker" },
  { slug: "e-com-sas", name: "e-COM SAS", seats: 2, role: "Partenaire" },
];

export const BUDGET_EXCLUDED_ORGS: ReadonlyArray<{
  slug: string;
  name: string;
  reason: string;
}> = [
  { slug: "sanja-service", name: "SanJa", reason: "Partenaire sans intervention porte" },
  { slug: "binance", name: "Binance", reason: "Pas de badge sur site" },
  { slug: "silikin", name: "Silikin Village", reason: "Lieu hôte - inclus location" },
  { slug: "pawapay", name: "pawaPay", reason: "Pas de badge sur site" },
];

export const BUDGET_PARTNER_SEATS = BUDGET_PARTNER_ORGS.reduce(
  (n, o) => n + o.seats,
  0,
);

export type BudgetScenarioId = "room37" | "room100";

export type BudgetLine = {
  id: string;
  label: string;
  detail: string;
  amountUsd: number;
};

export type BudgetSnapshot = {
  id: BudgetScenarioId;
  label: string;
  lede: string;
  roomCapacity: number;
  roomUsdPerDay: number;
  roomOfficialName: string;
  roomIncluded: readonly string[];
  builders: number;
  partners: number;
  ambassadors: number;
  staff: number;
  headcount: number;
  exceedsRoom: boolean;
  foodPerPersonPerDay: number;
  lines: BudgetLine[];
  subtotalOpsUsd: number;
  totalUsd: number;
};

export type BudgetSuggestion = {
  id: string;
  label: string;
  why: string;
};

/** Postes souvent oubliés - hors avantages déjà inclus dans la location Silikin. */
export const BUDGET_SUGGESTIONS: readonly BudgetSuggestion[] = [
  {
    id: "prizes",
    label: "Dotation / prix (cash ou nature)",
    why: "Motivation équipes + crédibilité Demo Day",
  },
  {
    id: "internet-backup",
    label: "Backup 4G / hotspot (complément)",
    why: "Internet Silikin inclus - utile en secours si saturation Wi-Fi",
  },
  {
    id: "power-strips",
    label: "Multiprises / rallonges",
    why: "Électricité Silikin incluse - besoin de points de charge laptops",
  },
  {
    id: "badges",
    label: "Badges / impression / signalétique",
    why: "Accueil, scan, zones partenaires",
  },
  {
    id: "water",
    label: "Eau & boissons hors pause",
    why: "Confort builders (chaleur Kinshasa)",
  },
  {
    id: "transport",
    label: "Transport staff / intervenants clés",
    why: "Ponctualité Demo Day & masterclass",
  },
  {
    id: "contingency",
    label: "Imprévus (8-12 %)",
    why: "Buffer logistique & last-minute",
  },
  {
    id: "cleaning",
    label: "Nettoyage fin de journée",
    why: "À confirmer si hors forfait salle",
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
  const builders = Math.max(0, Math.floor(args.builders));
  const headcount = builders + partners + ambassadors + staff;

  const isFull = args.id === "room100";
  const roomCapacity = isFull ? 100 : 37;
  const roomUsdPerDay = isFull ? ROOM_100_USD_PER_DAY : ROOM_37_USD_PER_DAY;
  const roomOfficialName = isFull
    ? ROOM_100_OFFICIAL_NAME
    : ROOM_37_OFFICIAL_NAME;
  const roomIncluded = isFull ? ROOM_100_INCLUDED : ROOM_37_INCLUDED;
  const roomTotal = money(roomUsdPerDay * HACKATHON_BUDGET_DAYS);
  const foodDay = foodUsdPerPersonDay();
  const foodTotal = money(headcount * foodDay * HACKATHON_BUDGET_DAYS);

  const lines: BudgetLine[] = [
    {
      id: "room",
      label: isFull
        ? "Location Auditorium Business Center (100)"
        : "Location Campus Salle 2 Arrière (37)",
      detail: `${roomOfficialName} · ${roomUsdPerDay} $ × ${HACKATHON_BUDGET_DAYS} jours`,
      amountUsd: roomTotal,
    },
    {
      id: "food",
      label: "Restauration (déjeuner + pauses)",
      detail: `${headcount} pers. × ${foodDay} $/j × ${HACKATHON_BUDGET_DAYS} j (déj. ${LUNCH_USD_PER_PERSON_DAY} $ + pause ${PAUSE_USD_PER_PERSON_DAY} $)`,
      amountUsd: foodTotal,
    },
    {
      id: "cameraman",
      label: "Caméraman",
      detail: "Forfait couverture 2 jours",
      amountUsd: CAMERAMAN_USD,
    },
    {
      id: "marketing",
      label: "Marketing / diffusion",
      detail: "Affiches, posts, relances",
      amountUsd: MARKETING_USD,
    },
  ];

  const totalUsd = money(lines.reduce((s, l) => s + l.amountUsd, 0));

  return {
    id: args.id,
    label: isFull ? "Scénario 100 builders" : "Scénario salle 37",
    lede: isFull
      ? "Si l'édition atteint 100 builders confirmés - salle grande + restauration au complet."
      : "Effectif actuel (builders tenus + partenaires × 2 + ambassadeurs + McBuleli) - salle 37.",
    roomCapacity,
    roomUsdPerDay,
    roomOfficialName,
    roomIncluded,
    builders,
    partners,
    ambassadors,
    staff,
    headcount,
    exceedsRoom: headcount > roomCapacity,
    foodPerPersonPerDay: foodDay,
    lines,
    subtotalOpsUsd: money(CAMERAMAN_USD + MARKETING_USD),
    totalUsd,
  };
}

export function formatUsd(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
