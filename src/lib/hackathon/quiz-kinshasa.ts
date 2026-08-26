/**
 * Campagne places gratuites « Kinshasa » - quiz info / programmation.
 * Cap 25 réussites. 4 séries de 10 QCM (3 choix), réussite ≥ 70 %.
 */
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const KINSHASA_PROMO_CODE = "KINSHASA";
export const KINSHASA_UTM_CAMPAIGN = "quiz_kinshasa";
/** Hard stop (internal). Public messaging uses KINSHASA_PUBLIC_CAP. */
export const KINSHASA_QUIZ_CAP = 25;
/**
 * Public gauge (10/10). Mapped proportionally from internal seats:
 * publicRemaining = round(internalRemaining × 10 / 25).
 * Ex. 10 public = 100 % de 25 places code.
 */
export const KINSHASA_PUBLIC_CAP = 10;

/** Public remaining seats (0…10) from internal claimed count (0…25). */
export function kinshasaPublicRemaining(claimed: number): number {
  const internalLeft = Math.max(0, KINSHASA_QUIZ_CAP - Math.max(0, claimed));
  if (internalLeft <= 0) return 0;
  return Math.max(
    0,
    Math.min(
      KINSHASA_PUBLIC_CAP,
      Math.round((internalLeft * KINSHASA_PUBLIC_CAP) / KINSHASA_QUIZ_CAP),
    ),
  );
}
export const KINSHASA_PASS_PERCENT = 70;
export const KINSHASA_QUESTION_COUNT = 10;
export const KINSHASA_SERIES_COUNT = 4;
/** Quiz wall-clock limit once the candidate starts. */
export const KINSHASA_QUIZ_MINUTES = 9;
/** Attempt token validity while answering (minutes). */
export const KINSHASA_ATTEMPT_TTL_MIN = 15;

export type KinshasaQuizQuestion = {
  id: string;
  promptFr: string;
  optionsFr: [string, string, string];
  /** 0-based - never send to the client. */
  correctIndex: 0 | 1 | 2;
};

export type KinshasaSeriesId = 0 | 1 | 2 | 3;

const SERIES_A: KinshasaQuizQuestion[] = [
  {
    id: "a1",
    promptFr: "Qu'est-ce qu'un algorithme ?",
    optionsFr: [
      "Une suite d'instructions pour résoudre un problème",
      "Un type de virus informatique",
      "Un câble réseau",
    ],
    correctIndex: 0,
  },
  {
    id: "a2",
    promptFr: "Que signifie CPU ?",
    optionsFr: [
      "Carte de paiement universelle",
      "Unité centrale de traitement (processeur)",
      "Connexion privée utilisateur",
    ],
    correctIndex: 1,
  },
  {
    id: "a3",
    promptFr: "En programmation, une variable sert à…",
    optionsFr: [
      "Stocker une valeur nommée en mémoire",
      "Remplacer le clavier",
      "Compresser une image",
    ],
    correctIndex: 0,
  },
  {
    id: "a4",
    promptFr: "Quelle structure répète des instructions tant qu'une condition est vraie ?",
    optionsFr: ["Une boucle (while / for)", "Un commentaire", "Un fichier PDF"],
    correctIndex: 0,
  },
  {
    id: "a5",
    promptFr: "GitHub sert principalement à…",
    optionsFr: [
      "Héberger et versionner du code en équipe",
      "Envoyer des SMS",
      "Remplacer le système d'exploitation",
    ],
    correctIndex: 0,
  },
  {
    id: "a6",
    promptFr: "HTML sert à…",
    optionsFr: [
      "Structurer le contenu d'une page web",
      "Compiler du C++",
      "Chiffrer un disque dur",
    ],
    correctIndex: 0,
  },
  {
    id: "a7",
    promptFr: "Que fait une condition if / else ?",
    optionsFr: [
      "Choisit un chemin d'exécution selon une condition",
      "Efface automatiquement la base de données",
      "Augmente la RAM",
    ],
    correctIndex: 0,
  },
  {
    id: "a8",
    promptFr: "Qu'est-ce qu'une API ?",
    optionsFr: [
      "Une interface pour faire communiquer des logiciels",
      "Un antivirus",
      "Un format d'image",
    ],
    correctIndex: 0,
  },
  {
    id: "a9",
    promptFr: "En informatique, un bug est…",
    optionsFr: [
      "Une erreur ou un comportement inattendu dans un programme",
      "Un type de clavier",
      "Un protocole Wi-Fi",
    ],
    correctIndex: 0,
  },
  {
    id: "a10",
    promptFr: "Pourquoi versionner son code (commits) ?",
    optionsFr: [
      "Pour historiser, collaborer et pouvoir revenir en arrière",
      "Pour accélérer le processeur",
      "Pour désactiver le pare-feu",
    ],
    correctIndex: 0,
  },
];

const SERIES_B: KinshasaQuizQuestion[] = [
  {
    id: "b1",
    promptFr: "Que signifie RAM ?",
    optionsFr: [
      "Mémoire vive utilisée par les programmes en cours",
      "Disque dur externe",
      "Réseau d'accès mobile",
    ],
    correctIndex: 0,
  },
  {
    id: "b2",
    promptFr: "Un fichier .js contient généralement…",
    optionsFr: [
      "Du code JavaScript",
      "Une image JPEG",
      "Un document Word",
    ],
    correctIndex: 0,
  },
  {
    id: "b3",
    promptFr: "CSS sert principalement à…",
    optionsFr: [
      "Mettre en forme (styles) une page web",
      "Gérer la base de données",
      "Envoyer des e-mails",
    ],
    correctIndex: 0,
  },
  {
    id: "b4",
    promptFr: "Qu'est-ce qu'une fonction en programmation ?",
    optionsFr: [
      "Un bloc de code réutilisable qui fait une tâche",
      "Un type de clavier",
      "Un antivirus",
    ],
    correctIndex: 0,
  },
  {
    id: "b5",
    promptFr: "Internet et le Web : quelle affirmation est correcte ?",
    optionsFr: [
      "Le Web est un service qui tourne sur Internet",
      "Internet et Web sont strictement la même chose",
      "Le Web remplace complètement Internet",
    ],
    correctIndex: 0,
  },
  {
    id: "b6",
    promptFr: "Que fait un navigateur web (Chrome, Firefox…) ?",
    optionsFr: [
      "Affiche et exécute des pages / apps web",
      "Remplace le processeur",
      "Compile uniquement du C",
    ],
    correctIndex: 0,
  },
  {
    id: "b7",
    promptFr: "Un tableau (array) sert à…",
    optionsFr: [
      "Stocker une liste ordonnée de valeurs",
      "Chauffer le CPU",
      "Créer un compte e-mail",
    ],
    correctIndex: 0,
  },
  {
    id: "b8",
    promptFr: "Que signifie open source ?",
    optionsFr: [
      "Le code source est consultable / modifiable selon une licence",
      "Le logiciel est toujours payant",
      "Le code est secret par définition",
    ],
    correctIndex: 0,
  },
  {
    id: "b9",
    promptFr: "Un mot de passe fort devrait…",
    optionsFr: [
      "Être long, unique et difficile à deviner",
      "Être le même partout",
      "Être uniquement le prénom",
    ],
    correctIndex: 0,
  },
  {
    id: "b10",
    promptFr: "Git sert à…",
    optionsFr: [
      "Suivre l'historique des modifications du code",
      "Remplacer Wi-Fi",
      "Imprimer des documents",
    ],
    correctIndex: 0,
  },
];

const SERIES_C: KinshasaQuizQuestion[] = [
  {
    id: "c1",
    promptFr: "Que signifie URL ?",
    optionsFr: [
      "Adresse d'une ressource sur le Web",
      "Un type de processeur",
      "Un format audio",
    ],
    correctIndex: 0,
  },
  {
    id: "c2",
    promptFr: "JSON sert souvent à…",
    optionsFr: [
      "Échanger des données structurées entre apps",
      "Compresser une vidéo 4K",
      "Remplacer le clavier",
    ],
    correctIndex: 0,
  },
  {
    id: "c3",
    promptFr: "Un serveur web…",
    optionsFr: [
      "Répond aux requêtes des clients (navigateurs, apps)",
      "Est uniquement une imprimante",
      "Remplace la batterie",
    ],
    correctIndex: 0,
  },
  {
    id: "c4",
    promptFr: "Que fait un debugger ?",
    optionsFr: [
      "Aide à trouver et corriger des erreurs dans le code",
      "Achète des domaines",
      "Augmente la résolution d'écran",
    ],
    correctIndex: 0,
  },
  {
    id: "c5",
    promptFr: "HTTPS signifie surtout que…",
    optionsFr: [
      "La connexion est chiffrée (plus sûre que HTTP)",
      "Le site est forcément gratuit",
      "Il n'y a plus besoin de mots de passe",
    ],
    correctIndex: 0,
  },
  {
    id: "c6",
    promptFr: "Une base de données sert à…",
    optionsFr: [
      "Stocker et interroger des données de façon organisée",
      "Remplacer le moniteur",
      "Charger une batterie",
    ],
    correctIndex: 0,
  },
  {
    id: "c7",
    promptFr: "Le terminal / ligne de commande permet de…",
    optionsFr: [
      "Contrôler l'ordinateur via des commandes texte",
      "Uniquement regarder des films",
      "Remplacer la carte SIM",
    ],
    correctIndex: 0,
  },
  {
    id: "c8",
    promptFr: "Qu'est-ce qu'un framework ?",
    optionsFr: [
      "Un cadre / outil qui structure le développement d'apps",
      "Un type de virus",
      "Un câble HDMI",
    ],
    correctIndex: 0,
  },
  {
    id: "c9",
    promptFr: "Frontend vs backend : le frontend…",
    optionsFr: [
      "Concerne surtout l'interface vue par l'utilisateur",
      "Est uniquement le serveur de base de données",
      "Est le câblage électrique du bâtiment",
    ],
    correctIndex: 0,
  },
  {
    id: "c10",
    promptFr: "Un commit Git représente…",
    optionsFr: [
      "Un instantané enregistré des changements du projet",
      "Une panne matérielle",
      "Un format d'image",
    ],
    correctIndex: 0,
  },
];

const SERIES_D: KinshasaQuizQuestion[] = [
  {
    id: "d1",
    promptFr: "Que signifie IDE ?",
    optionsFr: [
      "Environnement de développement intégré (éditeur + outils)",
      "Internet de données étendues",
      "Image digitale externe",
    ],
    correctIndex: 0,
  },
  {
    id: "d2",
    promptFr: "Un booléen peut prendre…",
    optionsFr: [
      "Vrai ou faux (true / false)",
      "Uniquement des images",
      "Toujours 256 valeurs",
    ],
    correctIndex: 0,
  },
  {
    id: "d3",
    promptFr: "Que fait npm / pip (gestionnaires de paquets) ?",
    optionsFr: [
      "Installent et gèrent des bibliothèques de code",
      "Remplacent le Wi-Fi",
      "Créent des cartes SIM",
    ],
    correctIndex: 0,
  },
  {
    id: "d4",
    promptFr: "Une requête HTTP GET sert surtout à…",
    optionsFr: [
      "Lire / récupérer une ressource",
      "Éteindre le serveur physiquement",
      "Formater le disque",
    ],
    correctIndex: 0,
  },
  {
    id: "d5",
    promptFr: "Le cloud computing, c'est…",
    optionsFr: [
      "Des services / serveurs accessibles via Internet",
      "Uniquement la météo",
      "Un type de clavier mécanique",
    ],
    correctIndex: 0,
  },
  {
    id: "d6",
    promptFr: "Qu'est-ce qu'un pull request (PR) ?",
    optionsFr: [
      "Une proposition de fusion de changements dans un dépôt",
      "Une panne électrique",
      "Un antivirus",
    ],
    correctIndex: 0,
  },
  {
    id: "d7",
    promptFr: "La console du navigateur sert souvent à…",
    optionsFr: [
      "Voir logs et erreurs JavaScript",
      "Remplacer la batterie",
      "Imprimer uniquement en 3D",
    ],
    correctIndex: 0,
  },
  {
    id: "d8",
    promptFr: "Un typo / type (en typage) décrit…",
    optionsFr: [
      "La nature d'une valeur (nombre, texte, booléen…)",
      "La couleur du boîtier",
      "Le prix du laptop",
    ],
    correctIndex: 0,
  },
  {
    id: "d9",
    promptFr: "Pourquoi tester son code ?",
    optionsFr: [
      "Pour vérifier qu'il se comporte comme prévu",
      "Pour ralentir volontairement le CPU",
      "Pour supprimer Internet",
    ],
    correctIndex: 0,
  },
  {
    id: "d10",
    promptFr: "Un environnement de développement (dev) est…",
    optionsFr: [
      "L'espace où l'on construit et teste avant la prod",
      "Uniquement la salle de réunion",
      "Un format PDF",
    ],
    correctIndex: 0,
  },
];

export const KINSHASA_QUIZ_SERIES: [
  KinshasaQuizQuestion[],
  KinshasaQuizQuestion[],
  KinshasaQuizQuestion[],
  KinshasaQuizQuestion[],
] = [SERIES_A, SERIES_B, SERIES_C, SERIES_D];

export function pickKinshasaSeriesId(): KinshasaSeriesId {
  return randomInt(0, KINSHASA_SERIES_COUNT) as KinshasaSeriesId;
}

export function getKinshasaSeries(
  seriesId: number,
): KinshasaQuizQuestion[] | null {
  if (!Number.isInteger(seriesId) || seriesId < 0 || seriesId > 3) return null;
  return KINSHASA_QUIZ_SERIES[seriesId as KinshasaSeriesId];
}

export function kinshasaPublicQuestions(seriesId: number) {
  const series = getKinshasaSeries(seriesId);
  if (!series) return [];
  return series.map(({ id, promptFr, optionsFr }) => ({
    id,
    promptFr,
    optionsFr: [...optionsFr] as string[],
  }));
}

export function scoreKinshasaQuiz(
  seriesId: number,
  answers: Array<{ questionId: string; choiceIndex: number }>,
): { correct: number; total: number; percent: number; passed: boolean } {
  const series = getKinshasaSeries(seriesId);
  const total = KINSHASA_QUESTION_COUNT;
  if (!series) {
    return { correct: 0, total, percent: 0, passed: false };
  }
  const byId = new Map(series.map((q) => [q.id, q.correctIndex] as const));
  let correct = 0;
  for (const a of answers) {
    const expected = byId.get(a.questionId);
    if (expected === undefined) continue;
    if (a.choiceIndex === expected) correct += 1;
  }
  const percent = Math.round((correct / total) * 100);
  return {
    correct,
    total,
    percent,
    passed: percent >= KINSHASA_PASS_PERCENT,
  };
}

function attemptSecret(): string {
  return (
    process.env.KINSHASA_QUIZ_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "mcbuleli-kinshasa-quiz-dev"
  );
}

export type KinshasaAttemptPayload = {
  seriesId: KinshasaSeriesId;
  email: string;
  phone: string;
  exp: number;
};

export function signKinshasaAttempt(payload: KinshasaAttemptPayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const sig = createHmac("sha256", attemptSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifyKinshasaAttempt(
  token: string,
): KinshasaAttemptPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;
  const expected = createHmac("sha256", attemptSecret())
    .update(body)
    .digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const raw = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as KinshasaAttemptPayload;
    if (
      typeof raw.seriesId !== "number" ||
      raw.seriesId < 0 ||
      raw.seriesId > 3 ||
      typeof raw.email !== "string" ||
      typeof raw.phone !== "string" ||
      typeof raw.exp !== "number"
    ) {
      return null;
    }
    if (raw.exp < Date.now()) return null;
    return raw as KinshasaAttemptPayload;
  } catch {
    return null;
  }
}
