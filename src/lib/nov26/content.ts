/** Marketing copy for mcbuleli.com/nov26 (formation en ligne Nov 2026). */

export const NOV26_POSTER_PATH = "/events/nov26/affiche.png";

export const NOV26_PRICE_USD = "50";

export const NOV26_DATES_LABEL_FR = "27 – 29 novembre 2026";
export const NOV26_DATES_LABEL_EN = "November 27 – 29, 2026";

export const NOV26_TIME_LABEL_FR = "19h30 GMT+1 · Google Meet";
export const NOV26_TIME_LABEL_EN = "7:30 PM GMT+1 · Google Meet";

export const NOV26_TITLE_FR =
  "Créez une app · Intelligence artificielle";
export const NOV26_TITLE_EN =
  "Build an app · Artificial intelligence";

export const NOV26_TAGLINE_FR =
  "Formation pratique en ligne avec Cursor, Claude et Codex. Devenez créateur de solutions numériques.";
export const NOV26_TAGLINE_EN =
  "Hands-on online training with Cursor, Claude, and Codex. Become a builder of digital solutions.";

export type Nov26ProgramDay = {
  day: number;
  labelFr: string;
  labelEn: string;
  topicsFr: string[];
  topicsEn: string[];
};

export const NOV26_PROGRAM: Nov26ProgramDay[] = [
  {
    day: 1,
    labelFr: "Jour 1 · Fondations & Vibe Coding",
    labelEn: "Day 1 · Foundations & Vibe Coding",
    topicsFr: [
      "Esprit Vibe Coding et cadrage du projet app IA",
      "Cursor, Claude, Codex : workflow concret",
      "Premier squelette fonctionnel",
    ],
    topicsEn: [
      "Vibe Coding mindset and scoping your AI app",
      "Cursor, Claude, Codex: a practical workflow",
      "First working skeleton",
    ],
  },
  {
    day: 2,
    labelFr: "Jour 2 · Construction",
    labelEn: "Day 2 · Build",
    topicsFr: [
      "Itération avec l'IA (debug, tests, UX)",
      "Intégrations utiles (auth, données, API)",
      "Bonnes pratiques déploiement",
    ],
    topicsEn: [
      "Iterating with AI (debug, tests, UX)",
      "Useful integrations (auth, data, APIs)",
      "Deployment best practices",
    ],
  },
  {
    day: 3,
    labelFr: "Jour 3 · Finalisation & démo",
    labelEn: "Day 3 · Polish & demo",
    topicsFr: [
      "Finition produit et documentation",
      "Démo individuelle / Q&A",
      "Prochaines étapes (portfolio, McBuleli Academy)",
    ],
    topicsEn: [
      "Product polish and documentation",
      "Individual demo / Q&A",
      "Next steps (portfolio, McBuleli Academy)",
    ],
  },
];

export function getNov26GoogleMeetUrl(): string | null {
  const url = process.env.NOV26_GOOGLE_MEET_URL?.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

export const NOV26_TOOL_TAGS = ["Cursor", "Claude", "Codex"] as const;

export type Nov26FaqItem = {
  qFr: string;
  qEn: string;
  aFr: string;
  aEn: string;
};

export const NOV26_FAQ: Nov26FaqItem[] = [
  {
    qFr: "Faut-il déjà savoir coder ?",
    qEn: "Do I need to code already?",
    aFr: "Non. Niveau débutant bienvenu : on construit pas à pas avec l'IA (Vibe Coding). Un ordinateur stable et une connexion internet suffisent.",
    aEn: "No. Beginners welcome: we build step by step with AI (Vibe Coding). A stable computer and internet are enough.",
  },
  {
    qFr: "Comment se déroule la formation ?",
    qEn: "How does the training run?",
    aFr: "Trois soirées en direct sur Google Meet (19h30 GMT+1). Exercices pratiques, démo le dernier jour. Lien Meet dans votre espace après paiement.",
    aEn: "Three live evenings on Google Meet (7:30 PM GMT+1). Hands-on exercises, demo on the last day. Meet link in your hub after payment.",
  },
  {
    qFr: "Pré-inscription ou paiement immédiat ?",
    qEn: "Pre-register or pay now?",
    aFr: "Les deux : place réservée gratuite avec rappels, ou paiement Mobile Money (Orange, M-Pesa, Airtel) pour confirmer tout de suite.",
    aEn: "Both: free seat hold with reminders, or Mobile Money (Orange, M-Pesa, Airtel) to confirm immediately.",
  },
  {
    qFr: "C'est le hackathon Kinshasa ?",
    qEn: "Is this the Kinshasa hackathon?",
    aFr: "Non. Événement distinct : formation en ligne de novembre, centrée sur une app IA avec Cursor / Claude / Codex.",
    aEn: "No. Separate event: November online training focused on an AI app with Cursor / Claude / Codex.",
  },
];

export const NOV26_NAV = [
  { id: "register", labelFr: "Inscription", labelEn: "Register" },
  { id: "programme", labelFr: "Programme", labelEn: "Program" },
  { id: "faq", labelFr: "FAQ", labelEn: "FAQ" },
] as const;
