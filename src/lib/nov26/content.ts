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
  "Formation pratique en ligne avec Cursor, Claude et Codex — développeurs, entrepreneurs et équipes qui veulent améliorer leur quotidien avec l'IA.";
export const NOV26_TAGLINE_EN =
  "Hands-on online training with Cursor, Claude, and Codex — for developers, entrepreneurs, and teams leveling up everyday work with AI.";

/** Sous-titre section Programme (Contenu · Trois soirées). */
export const NOV26_PROGRAM_INTRO_FR =
  "Pas seulement du code : automatiser, produire, communiquer et servir vos clients mieux — avec des outils que vous gardez après la formation.";
export const NOV26_PROGRAM_INTRO_EN =
  "Not just coding: automate, create, communicate, and serve clients better — with tools you keep after the training.";

/** Bloc court « à l'issue » (même préoccupation que prospects B2B). */
export const NOV26_OUTCOMES_TITLE_FR = "À l'issue de la formation";
export const NOV26_OUTCOMES_TITLE_EN = "After the training";
export const NOV26_OUTCOMES_INTRO_FR =
  "Vous repartez avec des gestes concrets — service client, contenu, processus — et les outils pour continuer seul.";
export const NOV26_OUTCOMES_INTRO_EN =
  "You leave with concrete skills — support, content, processes — and tools to keep going on your own.";

export const NOV26_OUTCOMES: { fr: string; en: string }[] = [
  {
    fr: "Messages pro (WhatsApp, e-mail) avec l'IA, validés avant envoi",
    en: "Pro messages (WhatsApp, email) with AI, reviewed before sending",
  },
  {
    fr: "Publications et légendes pour vos réseaux sociaux",
    en: "Posts and captions for your social channels",
  },
  {
    fr: "Prospection, relances et tri des demandes clients",
    en: "Lead follow-up and prioritizing client requests",
  },
  {
    fr: "Premiers pas vers un assistant métier (FAQ, rappel) via API",
    en: "First steps toward a business assistant (FAQ, callbacks) via API",
  },
  {
    fr: "Autonomie avec Cursor, Claude et Codex au quotidien",
    en: "Day-to-day autonomy with Cursor, Claude, and Codex",
  },
];

export type Nov26LearnerBenefit = {
  id: string;
  titleFr: string;
  titleEn: string;
  detailFr: string;
  detailEn: string;
};

/** Avantages McBuleli / partenaires (orientation + accès premium RS / outils). */
export const NOV26_LEARNER_BENEFITS: Nov26LearnerBenefit[] = [
  {
    id: "x-verified",
    titleFr: "Compte X (vérifié)",
    titleEn: "X (verified account)",
    detailFr:
      "Accompagnement pour renforcer votre présence pro : badge vérifié, bonnes pratiques de publication et visibilité auprès de votre audience.",
    detailEn:
      "Guidance to strengthen your professional presence: verified badge, publishing best practices, and visibility with your audience.",
  },
  {
    id: "xai",
    titleFr: "xAI & assistants",
    titleEn: "xAI & assistants",
    detailFr:
      "Découvrir Grok / xAI et les assistants modernes pour veille, réponses clients et contenu — au-delà du simple chat.",
    detailEn:
      "Explore Grok / xAI and modern assistants for monitoring, customer replies, and content — beyond basic chat.",
  },
  {
    id: "cursor",
    titleFr: "Cursor & Codex",
    titleEn: "Cursor & Codex",
    detailFr:
      "Workflow premium Cursor + Claude + Codex : accélérer sites, apps, docs et prototypes sans équipe technique complète.",
    detailEn:
      "Premium Cursor + Claude + Codex workflow: ship sites, apps, docs, and prototypes without a full dev team.",
  },
  {
    id: "business",
    titleFr: "Entreprises & services",
    titleEn: "Business & services",
    detailFr:
      "Cas concrets : devis, FAQ, suivi client, mini-outils métier — pour PME, ONG, commerces et indépendants, pas uniquement les devs.",
    detailEn:
      "Real cases: quotes, FAQ, client follow-up, small business tools — for SMEs, NGOs, shops, and freelancers, not devs only.",
  },
];

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
      "Esprit Vibe Coding : app IA ou outil métier (pas que les développeurs)",
      "Cursor, Claude, Codex — premier flux de travail concret",
      "Cartographie : où l'IA améliore votre service au quotidien",
    ],
    topicsEn: [
      "Vibe Coding mindset: AI app or business tool (not devs only)",
      "Cursor, Claude, Codex — first concrete workflow",
      "Map where AI improves your everyday service",
    ],
  },
  {
    day: 2,
    labelFr: "Jour 2 · Construction",
    labelEn: "Day 2 · Build",
    topicsFr: [
      "Itération IA : contenu, processus, support client",
      "Intégrations utiles (données, API, automatisations légères)",
      "Entreprise : gagner du temps sur tâches répétitives",
    ],
    topicsEn: [
      "AI iteration: content, processes, customer support",
      "Useful integrations (data, APIs, light automation)",
      "Business: save time on repetitive tasks",
    ],
  },
  {
    day: 3,
    labelFr: "Jour 3 · Finalisation & démo",
    labelEn: "Day 3 · Polish & demo",
    topicsFr: [
      "Finition : doc, démo, passation à votre équipe",
      "Démo individuelle / Q&A (app ou cas métier)",
      "Suite : avantages apprenants (X, xAI, Cursor) & McBuleli Academy",
    ],
    topicsEn: [
      "Polish: docs, demo, handoff to your team",
      "Individual demo / Q&A (app or business case)",
      "Next: learner perks (X, xAI, Cursor) & McBuleli Academy",
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
    qFr: "Quelles compétences à l'issue de la formation ?",
    qEn: "What will I be able to do after the training?",
    aFr: "Réponses clients (WhatsApp, e-mail), contenu réseaux sociaux, prospection et relances, premiers pas API / assistant métier, et autonomie avec Cursor, Claude et Codex — applicable en entreprise comme en solo.",
    aEn: "Client replies (WhatsApp, email), social content, lead follow-up, first API / business-assistant steps, and autonomy with Cursor, Claude, and Codex — for teams or solo work.",
  },
  {
    qFr: "Faut-il déjà savoir coder ?",
    qEn: "Do I need to code already?",
    aFr: "Non. Débutants, entrepreneurs et équipes métier bienvenus : on avance pas à pas avec l'IA (Vibe Coding). Un ordinateur stable et internet suffisent.",
    aEn: "No. Beginners, entrepreneurs, and business teams welcome: we move step by step with AI (Vibe Coding). A stable computer and internet are enough.",
  },
  {
    qFr: "C'est réservé aux développeurs ?",
    qEn: "Is this developers only?",
    aFr: "Non. L'objectif est d'améliorer votre activité (service client, contenu, processus) avec Cursor, Claude et Codex — avec ou sans bagage technique.",
    aEn: "No. The goal is to improve your work (support, content, processes) with Cursor, Claude, and Codex — with or without a technical background.",
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
    aFr: "Les deux : place réservée sans date limite, rappels e-mail toutes les 24 h jusqu'au paiement (MoMo ou USDT bientôt), ou paiement immédiat pour confirmer tout de suite.",
    aEn: "Both: seat held with no expiry, email reminders every 24 h until you pay (MoMo or USDT soon), or pay now to confirm immediately.",
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
