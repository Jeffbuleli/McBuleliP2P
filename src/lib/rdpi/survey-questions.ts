/**
 * RDPI Think Tank - questionnaire fiscalité / secteur numérique RDC.
 * Source: RESEARCH FOR DEVELOPMENT AND PROSPERITY INSTITUTE.docx
 */

export const RDPI_SURVEY_SLUG = "fiscalite-numerique-rdc-2026";

export const RDPI_BRAND = {
  name: "RDPI Think Tank",
  fullName: "Research for Development and Prosperity Institute",
  logoUrl: "/partners/rdpi-thinktank-logo.png?v=20260807c",
  website: "https://rdpithinktank.org/",
  blue: "#1E5EFF",
  gold: "#E8B923",
  ink: "#0A0A0A",
  paper: "#F7F5F0",
  muted: "#5C5A55",
} as const;

export const SEX_OPTIONS = [
  "Homme",
  "Femme",
  "Préfère ne pas répondre",
] as const;

export const AGE_OPTIONS = [
  "Moins de 25 ans",
  "25-34 ans",
  "35-44 ans",
  "45-54 ans",
  "55 ans et plus",
] as const;

export const ACTIVITY_OPTIONS = [
  "Startup numérique",
  "Développeur d'applications",
  "Entreprise informatique",
  "Fintech",
  "Plateforme numérique",
  "Commerce électronique",
  "Hébergement web",
  "Centre de données",
  "Cabinet informatique",
  "Incubateur",
  "Investisseur",
  "Université",
  "Autre",
] as const;

export const YEARS_OPTIONS = [
  "Moins de 1 an",
  "1 à 3 ans",
  "4 à 6 ans",
  "Plus de 6 ans",
] as const;

export const EMPLOYEES_OPTIONS = [
  "1-5",
  "6-10",
  "11-20",
  "21-50",
  "Plus de 50",
] as const;

/** 26 provinces de la RDC (libellés canoniques dashboard / formulaire). */
export const DRC_PROVINCES = [
  "Kinshasa",
  "Kongo Central",
  "Kwango",
  "Kwilu",
  "Mai-Ndombe",
  "Équateur",
  "Mongala",
  "Nord-Ubangi",
  "Sud-Ubangi",
  "Tshuapa",
  "Tshopo",
  "Bas-Uele",
  "Haut-Uele",
  "Ituri",
  "Nord-Kivu",
  "Sud-Kivu",
  "Maniema",
  "Haut-Katanga",
  "Lualaba",
  "Haut-Lomami",
  "Tanganyika",
  "Lomami",
  "Sankuru",
  "Kasaï",
  "Kasaï Central",
  "Kasaï Oriental",
] as const;

export type DrcProvince = (typeof DRC_PROVINCES)[number];

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Clé de comparaison : minuscule, sans accents, espaces/traits unifiés. */
export function provinceMatchKey(raw: string): string {
  return stripDiacritics(raw)
    .toLowerCase()
    .replace(/[''`´]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const PROVINCE_ALIAS_TO_CANONICAL = (() => {
  const map = new Map<string, DrcProvince>();
  for (const p of DRC_PROVINCES) {
    map.set(provinceMatchKey(p), p);
  }
  const extras: Array<[string, DrcProvince]> = [
    ["kin", "Kinshasa"],
    ["kinshsa", "Kinshasa"],
    ["ville de kinshasa", "Kinshasa"],
    ["bas congo", "Kongo Central"],
    ["bascongo", "Kongo Central"],
    ["congo central", "Kongo Central"],
    ["mai ndombe", "Mai-Ndombe"],
    ["maindombe", "Mai-Ndombe"],
    ["equateur", "Équateur"],
    ["nord ubangi", "Nord-Ubangi"],
    ["sud ubangi", "Sud-Ubangi"],
    ["bas uele", "Bas-Uele"],
    ["haut uele", "Haut-Uele"],
    ["nord kivu", "Nord-Kivu"],
    ["nkivu", "Nord-Kivu"],
    ["sud kivu", "Sud-Kivu"],
    ["skivu", "Sud-Kivu"],
    ["haut katanga", "Haut-Katanga"],
    ["katanga", "Haut-Katanga"],
    ["haut lomami", "Haut-Lomami"],
    ["kasai", "Kasaï"],
    ["kasai central", "Kasaï Central"],
    ["kasai oriental", "Kasaï Oriental"],
    ["east kasai", "Kasaï Oriental"],
    ["west kasai", "Kasaï"],
    // Villes → province
    ["lubumbashi", "Haut-Katanga"],
    ["likasi", "Haut-Katanga"],
    ["kipushi", "Haut-Katanga"],
    ["kolwezi", "Lualaba"],
    ["goma", "Nord-Kivu"],
    ["butembo", "Nord-Kivu"],
    ["beni", "Nord-Kivu"],
    ["bukavu", "Sud-Kivu"],
    ["uvira", "Sud-Kivu"],
    ["kisangani", "Tshopo"],
    ["mbuji mayi", "Kasaï Oriental"],
    ["mbujimayi", "Kasaï Oriental"],
    ["kananga", "Kasaï Central"],
    ["tshikapa", "Kasaï"],
    ["matadi", "Kongo Central"],
    ["boma", "Kongo Central"],
    ["bande", "Kongo Central"],
    ["mbandaka", "Équateur"],
    ["kindu", "Maniema"],
    ["kalemie", "Tanganyika"],
    ["bungu", "Mai-Ndombe"],
    ["bandundu", "Kwilu"],
    ["kikwit", "Kwilu"],
    ["gemena", "Sud-Ubangi"],
    ["bunia", "Ituri"],
    ["isiro", "Haut-Uele"],
  ];
  for (const [alias, canon] of extras) {
    map.set(provinceMatchKey(alias), canon);
  }
  return map;
})();

/**
 * Mappe une saisie libre vers une province canonique (26).
 * Retourne null si non reconnue.
 */
export function canonicalizeProvince(raw: string): DrcProvince | null {
  const key = provinceMatchKey(raw);
  if (!key) return null;
  return PROVINCE_ALIAS_TO_CANONICAL.get(key) ?? null;
}

export const LIKERT_ITEMS = [
  { key: "taxesJustified", label: "Les nouvelles taxes sont justifiées." },
  { key: "amountsProportional", label: "Les montants sont proportionnés." },
  {
    key: "improveRegulation",
    label: "Elles amélioreront la régulation du secteur.",
  },
  {
    key: "protectConsumers",
    label: "Elles protégeront les consommateurs.",
  },
  {
    key: "favorInvestment",
    label: "Elles favoriseront les investissements numériques.",
  },
  {
    key: "encourageStartups",
    label: "Elles encourageront la création de startups.",
  },
  { key: "reduceInnovation", label: "Elles réduiront l'innovation." },
  {
    key: "increaseCosts",
    label: "Elles augmenteront les coûts des entreprises.",
  },
  {
    key: "favorInformality",
    label: "Elles risquent de favoriser l'informalité.",
  },
  {
    key: "reduceCompetitiveness",
    label: "Elles réduiront la compétitivité de la RDC.",
  },
] as const;

export const IMPACT_ORG_OPTIONS = [
  "Très négatif",
  "Négatif",
  "Aucun",
  "Positif",
  "Très positif",
] as const;

/** Couleurs sémantiques pour l'échelle d'impact (API + charts). */
export const IMPACT_ORG_COLORS: Record<
  (typeof IMPACT_ORG_OPTIONS)[number],
  string
> = {
  "Très négatif": "#991B1B",
  Négatif: "#DC2626",
  Aucun: "#64748B",
  Positif: "#1E5EFF",
  "Très positif": "#15803D",
};

export const IMPACT_DOMAIN_OPTIONS = [
  "Investissement",
  "Innovation",
  "Emploi",
  "Rentabilité",
  "Prix des services",
  "Croissance",
] as const;

export const ACTION_OPTIONS = [
  "Réduire vos investissements",
  "Réduire les recrutements",
  "Reporter des projets",
  "Délocaliser certaines activités dans un autre pays favorable à l'innovation numérique",
  "Augmenter les prix",
  "Arrêt de notre fonctionnement",
  "Aucun changement",
] as const;

export const YES_NO_UNCERTAIN = ["Oui", "Non", "Incertain"] as const;
export const YES_NO = ["Oui", "Non"] as const;

export const OBSTACLE_ITEMS = [
  { key: "fiscalite", label: "Fiscalité" },
  { key: "corruption", label: "Corruption" },
  { key: "procedures", label: "Procédures administratives" },
  { key: "financement", label: "Accès au financement" },
  { key: "internet", label: "Internet" },
  { key: "electricite", label: "Électricité" },
  { key: "cadreJuridique", label: "Cadre juridique" },
] as const;

export const OBSTACLE_LEVELS = [
  "Aucun",
  "Faible",
  "Moyen",
  "Élevé",
  "Très élevé",
] as const;

export const REFORM_ITEMS = [
  { key: "reduceTaxes", label: "Réduire les taxes" },
  { key: "oneStopShop", label: "Guichet unique numérique" },
  { key: "startupExemption", label: "Exonération des startups" },
  {
    key: "digitizeProcedures",
    label: "Digitaliser les procédures et simplification administrative",
  },
  { key: "innovationFund", label: "Fonds d'innovation" },
  { key: "taxIncentives", label: "Incitations fiscales" },
  { key: "abolishTaxes", label: "Supprimer les taxes" },
] as const;

/** Open / free-text fields shown in CSV + dashboard table. */
export const OPEN_TEXT_FIELDS = [
  {
    key: "foreignInvestors",
    csvHeader:
      "D5. Les nouvelles taxes décourageront-elles les investisseurs étrangers ? Si oui, pourquoi ?",
    tableHeader: "Investisseurs étrangers (D5)",
  },
  {
    key: "concernDisposition",
    csvHeader:
      "G1. Quelle disposition du nouvel arrêté vous préoccupe le plus ? Pourquoi ?",
    tableHeader: "Préoccupation (G1)",
  },
  {
    key: "innovationEffects",
    csvHeader:
      "G2. Quels seront les principaux effets de ces nouvelles taxes sur l'innovation ?",
    tableHeader: "Effets innovation (G2)",
  },
  {
    key: "startupMeasures",
    csvHeader:
      "G3. Quelles mesures proposeriez-vous pour soutenir davantage les startups numériques ?",
    tableHeader: "Mesures startups (G3)",
  },
  {
    key: "reconcileFiscal",
    csvHeader:
      "G4. Comment mieux concilier mobilisation fiscale et entrepreneuriat numérique ?",
    tableHeader: "Conciliation fiscale (G4)",
  },
  {
    key: "extraObservations",
    csvHeader: "G6. Observations ou recommandations supplémentaires",
    tableHeader: "Observations (G6)",
  },
] as const;

export type RdpiSurveyAnswers = {
  fullName: string;
  email: string;
  phone: string;
  /** Soft opt-in: McBuleli may follow up (unchecked by default). */
  mcbuleliContactOptIn: boolean;
  sex: (typeof SEX_OPTIONS)[number] | "";
  age: (typeof AGE_OPTIONS)[number] | "";
  province: string;
  activity: (typeof ACTIVITY_OPTIONS)[number] | "";
  activityOther: string;
  yearsActive: (typeof YEARS_OPTIONS)[number] | "";
  employees: (typeof EMPLOYEES_OPTIONS)[number] | "";
  likert: Record<string, number>;
  impactOrg: (typeof IMPACT_ORG_OPTIONS)[number] | "";
  impactDomain: string[];
  actions: string[];
  consumerCost: (typeof YES_NO_UNCERTAIN)[number] | "";
  foreignInvestors: string;
  obstacles: Record<string, number>;
  opportunityRegulation: (typeof YES_NO)[number] | "";
  threeRegimes: (typeof YES_NO)[number] | "";
  reformRanks: Record<string, number>;
  concernDisposition: string;
  innovationEffects: string;
  startupMeasures: string;
  reconcileFiscal: string;
  digitizePerception: (typeof YES_NO)[number] | "";
  extraObservations: string;
};

export function emptyRdpiAnswers(): RdpiSurveyAnswers {
  const likert: Record<string, number> = {};
  for (const item of LIKERT_ITEMS) likert[item.key] = 0;
  const obstacles: Record<string, number> = {};
  for (const item of OBSTACLE_ITEMS) obstacles[item.key] = 0;
  const reformRanks: Record<string, number> = {};
  for (const item of REFORM_ITEMS) reformRanks[item.key] = 0;
  return {
    fullName: "",
    email: "",
    phone: "",
    mcbuleliContactOptIn: false,
    sex: "",
    age: "",
    province: "",
    activity: "",
    activityOther: "",
    yearsActive: "",
    employees: "",
    likert,
    impactOrg: "",
    impactDomain: [],
    actions: [],
    consumerCost: "",
    foreignInvestors: "",
    obstacles,
    opportunityRegulation: "",
    threeRegimes: "",
    reformRanks,
    concernDisposition: "",
    innovationEffects: "",
    startupMeasures: "",
    reconcileFiscal: "",
    digitizePerception: "",
    extraObservations: "",
  };
}

export const SURVEY_INTRO = {
  title:
    "L'impact de la fiscalité sur l'entrepreneuriat, l'innovation et le développement du secteur numérique en République démocratique du Congo",
  duration: "8 à 10 minutes",
  paragraphs: [
    "En date du 20 juillet 2026, le Ministère de l'Economie numérique et le Ministère des Finances en République démocratique du Congo ont pris, en application du Code du numérique, l'Arrêté interministériel n°015/CAB/MIN/EN/AKIM/MLNS/ALM/2026 et CAB/MIN/FINACES/2026/096 portant fixation des taux des droits, taxes et redevances à percevoir à l'initiative du Ministère de l'Economie Numérique.",
    "La publication de cet arrêté a suscité de vives réactions. Les acteurs du secteur numérique ont exprimé leur inquiétude face au nouveau barème - perçu comme une barrière majeure pour les startups aux ressources limitées, pourtant porteuses d'innovation et d'emplois.",
    "C'est dans ce contexte que le Research for Development and Prosperity Institute (RDPI Think Tank) mène une étude afin d'évaluer les effets de cette fiscalité. Les résultats permettront de formuler des recommandations fondées sur le terrain.",
    "Vos réponses resteront strictement confidentielles et seront utilisées uniquement à des fins de la présente recherche.",
  ],
} as const;

export const SECTION_META = [
  { id: "profil", title: "Profil du répondant", short: "Profil" },
  { id: "perception", title: "Perception des nouvelles taxes", short: "Perception" },
  { id: "impact", title: "Impact économique attendu", short: "Impact" },
  { id: "climat", title: "Climat des affaires", short: "Climat" },
  { id: "opportunites", title: "Opportunités", short: "Opportunités" },
  { id: "reformes", title: "Priorités de réforme", short: "Réformes" },
  { id: "ouvertes", title: "Questions ouvertes", short: "Ouvertes" },
] as const;
