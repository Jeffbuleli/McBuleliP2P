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
  "Trois soirées pour avancer de l'idée à une démo — app ou outil IA — avec Cursor, Claude et Codex.";
export const NOV26_PROGRAM_INTRO_EN =
  "Three evenings from idea to demo — an AI app or business tool — with Cursor, Claude, and Codex.";

/** Bloc court « à l'issue » — promesse publique formation (≠ propositions B2B personnalisées). */
export const NOV26_OUTCOMES_TITLE_FR = "À l'issue de la formation";
export const NOV26_OUTCOMES_TITLE_EN = "After the training";
export const NOV26_OUTCOMES_INTRO_FR =
  "Repartir avec une démo montrable et la méthode pour continuer seul — développeur, entrepreneur ou équipe.";
export const NOV26_OUTCOMES_INTRO_EN =
  "Leave with a showable demo and a method to keep going on your own — developer, entrepreneur, or team.";

export const NOV26_OUTCOMES: { fr: string; en: string }[] = [
  {
    fr: "Cadrer le projet : idée, utilisateurs, périmètre — objectif démo en 3 soirées",
    en: "Frame the project: idea, users, scope — demo goal in 3 evenings",
  },
  {
    fr: "Vibe Coding : itérer avec l'IA en relisant et validant avant d'avancer",
    en: "Vibe Coding: iterate with AI, review and validate before moving on",
  },
  {
    fr: "Prototyper écrans, contenu et logique sans équipe technique complète",
    en: "Prototype screens, content, and logic without a full technical team",
  },
  {
    fr: "Connecter API et petites automatisations lorsque votre cas l'exige",
    en: "Connect APIs and small automations when your use case needs them",
  },
  {
    fr: "Documenter, pitcher la démo et faire évoluer le projet après la formation",
    en: "Document, pitch the demo, and evolve the project after training",
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
    aFr: "Cadrer un projet IA, le mener jusqu'à une démo (app ou outil métier), pratiquer un flux Cursor · Claude · Codex, et savoir itérer ensuite — quel que soit votre profil.",
    aEn: "Scope an AI project, ship a demo (app or business tool), practice a Cursor · Claude · Codex workflow, and keep iterating — whatever your background.",
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
    aFr: "Non. On vise une première app ou un outil métier assisté par l'IA — pas un parcours réservé aux ingénieurs.",
    aEn: "No. We aim for a first AI-assisted app or business tool — not an engineers-only track.",
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
