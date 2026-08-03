/**
 * Personalized 1-month Vibe Coding + Pi SDK track for Mme Elisabeth Adilelou (Damienne).
 * Private hub: /hackathon/damienne — Meet room: /meet/damienne-formation
 */

export const DAMIENNE_LEARNER = {
  displayName: "Mme Elisabeth Adilelou",
  shortName: "Elisabeth",
  email: "elisabethadilehou571@gmail.com",
  country: "Bénin",
  timezone: "Africa/Porto-Novo",
  timezoneLabel: "GMT+1 · Porto-Novo",
} as const;

export const DAMIENNE_MEET_SLUG = "damienne-formation";

export const DAMIENNE_HUB_PATH = "/hackathon/damienne";

/** Emails allowed on the private hub (plus McBuleli staff roles). */
export const DAMIENNE_HUB_ALLOWLIST = [
  DAMIENNE_LEARNER.email,
  "ceo@mcbuleli.org",
  "hi@mcbuleli.org",
] as const;

export type DamienneSession = {
  id: string;
  num: number;
  /** ISO with +01:00 (Porto-Novo) */
  startsAt: string;
  durationMinutes: number;
  title: string;
  focus: string;
  outcomes: string[];
  module: string;
};

/**
 * 14 live sessions · Mon / Wed / Fri · 19:00 Porto-Novo · ~1 month from 3 Aug 2026.
 */
export const DAMIENNE_SESSIONS: DamienneSession[] = [
  {
    id: "s01",
    num: 1,
    startsAt: "2026-08-03T19:00:00+01:00",
    durationMinutes: 90,
    module: "Fondations",
    title: "Bienvenue & esprit Vibe Coding",
    focus:
      "Cadre de la formation, objectif Pi SDK, et première boucle intention → prompt → code → review.",
    outcomes: [
      "Comprendre le Vibe Coding (rôle humain vs IA)",
      "Installer Cursor et un compte GitHub",
      "Poser l'objectif app Pi pour le mois",
    ],
  },
  {
    id: "s02",
    num: 2,
    startsAt: "2026-08-05T19:00:00+01:00",
    durationMinutes: 90,
    module: "Outils",
    title: "Découvrir la stack (Cursor, Claude, Codex, GitHub)",
    focus: "Qui fait quoi : IDE agentique, raisonnement, génération, versions.",
    outcomes: [
      "Ouvrir un projet dans Cursor",
      "Premier prompt utile sur un fichier réel",
      "Premier commit GitHub",
    ],
  },
  {
    id: "s03",
    num: 3,
    startsAt: "2026-08-07T19:00:00+01:00",
    durationMinutes: 90,
    module: "Prompts",
    title: "Maîtriser les prompts pour développer",
    focus: "Instructions claires, contexte, découpage de tâches.",
    outcomes: [
      "Écrire un prompt structuré (objectif, contraintes, fichiers)",
      "Itérer sans tout régénérer",
      "Review d'un diff avant acceptation",
    ],
  },
  {
    id: "s04",
    num: 4,
    startsAt: "2026-08-10T19:00:00+01:00",
    durationMinutes: 90,
    module: "Cahier des charges",
    title: "De l'idée au cahier des charges",
    focus: "Transformer l'idée d'app Pi en scope concret et réalisable.",
    outcomes: [
      "User stories de l'app Pi",
      "Critères de succès du mois",
      "Maquette / squelette de pages",
    ],
  },
  {
    id: "s05",
    num: 5,
    startsAt: "2026-08-12T19:00:00+01:00",
    durationMinutes: 90,
    module: "Build",
    title: "Construire une app avec l'IA (frontend)",
    focus: "Pages, navigation, composants — accélérés par Cursor.",
    outcomes: [
      "Écran d'accueil + navigation",
      "Composants réutilisables",
      "Lire et expliquer le code généré",
    ],
  },
  {
    id: "s06",
    num: 6,
    startsAt: "2026-08-14T19:00:00+01:00",
    durationMinutes: 90,
    module: "Build",
    title: "Backend, données et API avec l'IA",
    focus: "Persistance légère, endpoints, connexion front ↔ back.",
    outcomes: [
      "Un endpoint utile pour l'app",
      "Modèle de données minimal",
      "Tester manuellement le flux",
    ],
  },
  {
    id: "s07",
    num: 7,
    startsAt: "2026-08-17T19:00:00+01:00",
    durationMinutes: 90,
    module: "Git & projet",
    title: "Git, GitHub et rythme de travail",
    focus: "Commits, branches, README, hygiène de projet.",
    outcomes: [
      "Historique de commits lisible",
      "README de présentation",
      "Secrets hors repo (.env)",
    ],
  },
  {
    id: "s08",
    num: 8,
    startsAt: "2026-08-19T19:00:00+01:00",
    durationMinutes: 90,
    module: "Pi Network",
    title: "Pi Network pour pioneers — panorama SDK",
    focus: "Écosystème Pi, sandbox, docs, architecture d'une Pi App.",
    outcomes: [
      "Comprendre auth Pi & paiements",
      "Choisir le périmètre MVP Pi",
      "Lier le cahier des charges au SDK",
    ],
  },
  {
    id: "s09",
    num: 9,
    startsAt: "2026-08-21T19:00:00+01:00",
    durationMinutes: 90,
    module: "Pi Network",
    title: "Intégrer l'authentification Pi",
    focus: "Login Pi dans l'app (flux pioneer → session).",
    outcomes: [
      "Brancher Pi Auth (sandbox)",
      "Afficher le profil pioneer",
      "Gérer les erreurs de connexion",
    ],
  },
  {
    id: "s10",
    num: 10,
    startsAt: "2026-08-24T19:00:00+01:00",
    durationMinutes: 90,
    module: "Pi Network",
    title: "Paiements Pi & logique métier",
    focus: "Créer et compléter un paiement Pi lié à une feature de l'app.",
    outcomes: [
      "Flux de paiement Pi de bout en bout (sandbox)",
      "Confirmation côté serveur",
      "UX claire pour l'utilisateur pioneer",
    ],
  },
  {
    id: "s11",
    num: 11,
    startsAt: "2026-08-26T19:00:00+01:00",
    durationMinutes: 90,
    module: "Qualité",
    title: "Déboguer et améliorer avec l'IA",
    focus: "Erreurs, tests manuels, refactoring guidé.",
    outcomes: [
      "Corriger un bug avec l'agent",
      "Checklist de revue avant démo",
      "Optimiser un parcours critique",
    ],
  },
  {
    id: "s12",
    num: 12,
    startsAt: "2026-08-28T19:00:00+01:00",
    durationMinutes: 90,
    module: "Sécurité",
    title: "Sécurité & bonnes pratiques Vibe Coding",
    focus: "Clés API, dépendances, code généré, données sensibles.",
    outcomes: [
      "Audit rapide des secrets",
      "Dépendances à jour / minimales",
      "Checklist pioneer-ready",
    ],
  },
  {
    id: "s13",
    num: 13,
    startsAt: "2026-08-31T19:00:00+01:00",
    durationMinutes: 90,
    module: "Projet final",
    title: "Finaliser l'app Pi de A à Z",
    focus: "Boucler le MVP : polish UI, README, démo scénario.",
    outcomes: [
      "Parcours démo stable",
      "Repo GitHub prêt à partager",
      "Notes de présentation",
    ],
  },
  {
    id: "s14",
    num: 14,
    startsAt: "2026-09-02T19:00:00+01:00",
    durationMinutes: 90,
    module: "Évaluation",
    title: "Démo finale & suite du parcours",
    focus: "Présentation de l'app, feedback, prochaines étapes pioneer.",
    outcomes: [
      "Démo live de l'app Pi",
      "Feedback structuré",
      "Plan de suite (Mainnet / itérations)",
    ],
  },
];

export function damienneSessionDateLabel(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Porto-Novo",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function damienneNextSession(now = new Date()): DamienneSession | null {
  const upcoming = DAMIENNE_SESSIONS.find(
    (s) => new Date(s.startsAt).getTime() + s.durationMinutes * 60_000 > now.getTime(),
  );
  return upcoming ?? DAMIENNE_SESSIONS[DAMIENNE_SESSIONS.length - 1] ?? null;
}

export function canAccessDamienneHub(args: {
  email: string | null | undefined;
  role?: string | null;
}): boolean {
  const email = (args.email ?? "").trim().toLowerCase();
  if (!email) return false;
  if (args.role === "agent" || args.role === "super_admin") return true;
  return (DAMIENNE_HUB_ALLOWLIST as readonly string[]).some(
    (e) => e.toLowerCase() === email,
  );
}
