import type { HackathonDeck, HackathonSlide } from "@/lib/hackathon/slides/types";

const agendaItems: Array<{
  num: number;
  title: string;
  subtitle: string;
  highlight?: boolean;
}> = [
  {
    num: 1,
    title: "Introduction au Vibe Coding",
    subtitle: "Définition, principes, avantages, limites, rôle de l'IA",
  },
  {
    num: 2,
    title: "Module 1 - Découvrir les outils",
    subtitle: "Cursor, Claude, Codex, GitHub et environnement",
    highlight: true,
  },
  {
    num: 3,
    title: "Module 2 - Maîtriser les prompts",
    subtitle: "Instructions, contexte, décomposition de tâches",
  },
  {
    num: 4,
    title: "Module 3 - De l'idée au cahier des charges",
    subtitle: "Transformer une idée en projet concret",
  },
  {
    num: 5,
    title: "Module 4 - Construire une application",
    subtitle: "Frontend, backend, base de données, API",
  },
  {
    num: 6,
    title: "Module 5 - Déboguer et améliorer",
    subtitle: "Erreurs, tests, refactoring, optimisation",
  },
  {
    num: 7,
    title: "Module 6 - Git, GitHub et gestion",
    subtitle: "Versions, commits, branches, collaboration",
  },
  {
    num: 8,
    title: "Module 7 - Sécurité et bonnes pratiques",
    subtitle: "Données sensibles, clés API, dépendances",
  },
  {
    num: 9,
    title: "Module 8 - Projet final",
    subtitle: "Une application de A à Z",
  },
  {
    num: 10,
    title: "Évaluation + présentation",
    subtitle: "Démo en visioconférence et évaluation",
  },
];

function s(partial: HackathonSlide): HackathonSlide {
  return partial;
}

export const vibeCodingMasterclassDeck: HackathonDeck = {
  slug: "vibe-coding-masterclass",
  titleFr: "Masterclass Vibe Coding",
  titleEn: "Vibe Coding Masterclass",
  descriptionFr:
    "Parcours bootcamp McBuleli - Introduction + Module 1 : découvrir et maîtriser les outils (Cursor, Claude, Codex, GitHub).",
  descriptionEn:
    "McBuleli bootcamp track - Intro + Module 1: discover and master the tools (Cursor, Claude, Codex, GitHub).",
  moduleLabelFr: "Module 1 - Outils",
  moduleLabelEn: "Module 1 - Tools",
  estimatedMinutes: 55,
  speakerHintFr:
    "Utilisez ← → pour naviguer, Espace pour révéler le quiz, F pour plein écran, L pour On Air.",
  speakerHintEn:
    "Use ← → to navigate, Space to reveal quiz, F for fullscreen, L to go On Air.",
  slides: [
    s({
      id: "cover",
      layout: "title",
      palette: "mint",
      eyebrow: "McBuleli Hackathon · Bootcamp",
      title: "Masterclass Vibe Coding",
      subtitle:
        "Coder avec l'IA - de l'intention au produit, sans perdre le contrôle.",
      illustration: "vibe-loop",
      notes:
        "Accueillir la salle. Présenter le speaker et le format : 55 min, quiz, devoir.",
    }),
    s({
      id: "why-here",
      layout: "content",
      palette: "forest",
      eyebrow: "Pourquoi vous êtes ici",
      title: "Deux jours pour devenir builder IA",
      body: [
        "Le McBuleli Hackathon n'est pas un concours de slides. C'est un bootcamp pratique puis une compétition de prototypes utiles pour la RDC.",
      ],
      bullets: [
        { text: "Jour 1 - Bootcamp Vibe Coding & Build" },
        { text: "Jour 2 - Build, mentorat, Demo Day & jury" },
        { text: "Objectif - une app réelle, pas une démo PowerPoint" },
      ],
      illustration: "project",
      notes: "Relier au programme Silikin Village 28-29 août.",
    }),
    s({
      id: "agenda",
      layout: "agenda",
      palette: "slate",
      eyebrow: "Parcours pédagogique",
      title: "La suite logique après l'Introduction",
      subtitle: "Dix étapes - nous attaquons aujourd'hui le Module 1.",
      agenda: agendaItems,
      illustration: "agenda",
      notes: "Pointer le Module 1 en highlight. Les modules 2-8 viennent ensuite.",
    }),
    s({
      id: "learning-goals",
      layout: "content",
      palette: "mint",
      eyebrow: "Objectifs de la session",
      title: "Ce que vous saurez faire ce soir",
      bullets: [
        { text: "Expliquer ce qu'est le Vibe Coding - et ce que ce n'est pas" },
        { text: "Choisir le bon outil selon la tâche (Cursor, Claude, Codex, GitHub)" },
        { text: "Configurer un environnement de travail minimal mais solide" },
        { text: "Lancer un premier prompt utile dans un vrai projet" },
      ],
      illustration: "tools-grid",
    }),

    // —— Introduction ——
    s({
      id: "intro-section",
      layout: "section",
      palette: "violet",
      eyebrow: "Étape 1",
      title: "Introduction au Vibe Coding",
      subtitle: "Définition · principes · avantages · limites · rôle de l'IA",
      illustration: "vibe-loop",
    }),
    s({
      id: "intro-definition",
      layout: "split",
      palette: "violet",
      eyebrow: "Définition",
      title: "Qu'est-ce que le Vibe Coding ?",
      body: [
        "Le Vibe Coding, c'est développer en dialogue continu avec l'IA : vous portez l'intention produit, l'IA accélère l'exécution - sous votre supervision.",
      ],
      bullets: [
        { text: "Vous décrivez le résultat souhaité en langage naturel" },
        { text: "L'IA propose du code, des fichiers, des tests" },
        { text: "Vous lisez, corrigez, validez - puis itérez" },
        { text: "Le rythme reste humain : intention → prompt → code → review" },
      ],
      illustration: "vibe-loop",
      notes: "Insister : ce n'est pas « laisser l'IA coder toute seule ».",
    }),
    s({
      id: "intro-principles",
      layout: "steps",
      palette: "violet",
      eyebrow: "Principes",
      title: "Quatre règles d'or",
      steps: [
        {
          num: 1,
          title: "Intention claire",
          body: "Savoir ce que vous voulez obtenir avant d'ouvrir le chat.",
        },
        {
          num: 2,
          title: "Contexte fourni",
          body: "Fichiers, stack, contraintes - l'IA ne lit pas dans votre tête.",
        },
        {
          num: 3,
          title: "Petites étapes",
          body: "Une tâche = un prompt. Découper vaut mieux qu'un monolithe.",
        },
        {
          num: 4,
          title: "Review humaine",
          body: "Lire le diff. Comprendre. Accepter ou rejeter. Vous restez responsable.",
        },
      ],
      illustration: "prompt-craft",
    }),
    s({
      id: "intro-advantages",
      layout: "content",
      palette: "forest",
      eyebrow: "Avantages",
      title: "Pourquoi ça change la donne",
      bullets: [
        { text: "Vitesse - prototyper en heures ce qui prenait des jours" },
        { text: "Accessibilité - builders non seniors peuvent avancer plus loin" },
        { text: "Apprentissage - l'IA explique le code qu'elle écrit" },
        { text: "Focus produit - plus de temps pour le problème métier RDC" },
      ],
      illustration: "build-stack",
    }),
    s({
      id: "intro-limits",
      layout: "content",
      palette: "coral",
      eyebrow: "Limites",
      title: "Ce que l'IA ne fera pas à votre place",
      bullets: [
        { text: "Elle peut halluciner des APIs ou des libs inexistantes" },
        { text: "Elle ignore parfois votre architecture réelle" },
        { text: "Elle peut introduire des failles de sécurité silencieuses" },
        { text: "Sans votre jugement, vous accumulez de la dette technique" },
      ],
      illustration: "limits",
      notes: "Montrer un exemple oral d'hallucination si possible.",
    }),
    s({
      id: "intro-ai-role",
      layout: "split",
      palette: "indigo",
      eyebrow: "Rôle de l'IA",
      title: "Copilote, pas pilote automatique",
      body: [
        "L'IA est un accélérateur de craft. Vous êtes le product owner, l'architecte et le responsable qualité.",
      ],
      bullets: [
        { text: "IA - génère, explique, propose des alternatives" },
        { text: "Vous - décidez, structurez, validez, livrez" },
        { text: "Équipe - partage le contexte et review les diffs" },
        { text: "Hackathon - l'IA aide, le jury note le résultat humain" },
      ],
      illustration: "ai-role",
    }),

    // —— Module 1 ——
    s({
      id: "m1-section",
      layout: "section",
      palette: "sky",
      eyebrow: "Étape 2 · Module 1",
      title: "Découvrir les outils de Vibe Coding",
      subtitle: "Cursor · Claude · Codex · GitHub · Environnement de travail",
      illustration: "tools-grid",
      notes: "Cœur de la session. Prévoir démos live si le réseau le permet.",
    }),
    s({
      id: "m1-map",
      layout: "tools",
      palette: "sky",
      eyebrow: "Cartographie",
      title: "Qui fait quoi dans la stack",
      tools: [
        {
          id: "cursor",
          name: "Cursor",
          role: "IDE agentique - éditer, naviguer, appliquer des diffs",
          accent: "sky",
        },
        {
          id: "claude",
          name: "Claude",
          role: "Raisonnement long - specs, architecture, explications",
          accent: "amber",
        },
        {
          id: "codex",
          name: "Codex",
          role: "Génération de code ciblée - fonctions, scripts, patches",
          accent: "indigo",
        },
        {
          id: "github",
          name: "GitHub",
          role: "Versions, sauvegarde, collaboration d'équipe",
          accent: "slate",
        },
      ],
      illustration: "tools-grid",
    }),
    s({
      id: "m1-cursor",
      layout: "split",
      palette: "sky",
      eyebrow: "Outil 1",
      title: "Cursor - votre atelier principal",
      body: [
        "Cursor est un éditeur de code avec agent IA intégré. C'est là que vous vivez 80 % du Vibe Coding pendant le hackathon.",
      ],
      bullets: [
        { text: "Chat inline et Composer pour des changements multi-fichiers" },
        { text: "L'agent lit le projet - pas seulement le fichier ouvert" },
        { text: "Vous acceptez ou refusez chaque modification" },
        { text: "Idéal pour itérer vite sur une feature concrète" },
      ],
      illustration: "cursor",
      notes: "Démo : ouvrir un fichier, demander une explication, puis un petit fix.",
    }),
    s({
      id: "m1-claude",
      layout: "split",
      palette: "amber",
      eyebrow: "Outil 2",
      title: "Claude - le cerveau de raisonnement",
      body: [
        "Claude excelle quand le problème est flou : cadrer une idée, écrire un cahier des charges, comparer des architectures.",
      ],
      bullets: [
        { text: "Excellent pour expliquer du code complexe" },
        { text: "Utile pour rédiger des user stories et des specs" },
        { text: "Bon partenaire pour challenger une approche" },
        { text: "À utiliser avant de coller 200 lignes dans Cursor" },
      ],
      illustration: "claude",
    }),
    s({
      id: "m1-codex",
      layout: "split",
      palette: "indigo",
      eyebrow: "Outil 3",
      title: "Codex - génération de code ciblée",
      body: [
        "Codex (et agents type OpenAI Codex) brille sur des tâches de génération : une fonction, un script, un test, un patch précis.",
      ],
      bullets: [
        { text: "Bon pour démarrer un module depuis zéro" },
        { text: "Utile pour transformer une spec courte en squelette" },
        { text: "Toujours revoir le code généré avant de commit" },
        { text: "Complète Cursor - ne le remplace pas dans le flux quotidien" },
      ],
      illustration: "codex",
    }),
    s({
      id: "m1-github",
      layout: "split",
      palette: "slate",
      eyebrow: "Outil 4",
      title: "GitHub - mémoire et collaboration",
      body: [
        "Sans GitHub, votre travail disparaît avec la machine. Avec GitHub, l'équipe partage, rollback et présente le repo au jury.",
      ],
      bullets: [
        { text: "Commits fréquents - petits, clairs, traçables" },
        { text: "Branches pour features risquées" },
        { text: "README lisible = bonus Demo Day" },
        { text: "Jamais de secrets (.env) dans le dépôt" },
      ],
      illustration: "github",
    }),
    s({
      id: "m1-workspace",
      layout: "steps",
      palette: "mint",
      eyebrow: "Environnement",
      title: "Setup minimal pour le bootcamp",
      steps: [
        {
          num: 1,
          title: "Compte & outils",
          body: "Compte GitHub + Cursor installé (Mac ou Windows).",
        },
        {
          num: 2,
          title: "Projet local",
          body: "Cloner ou créer un repo. Ouvrir le dossier dans Cursor.",
        },
        {
          num: 3,
          title: "Secrets hors repo",
          body: "Fichier .env local + .gitignore - jamais de clés API commitées.",
        },
        {
          num: 4,
          title: "Premier agent",
          body: "Demander à Cursor d'expliquer la structure du projet.",
        },
      ],
      illustration: "workspace",
    }),
    s({
      id: "m1-compare",
      layout: "content",
      palette: "sky",
      eyebrow: "Quand utiliser quoi",
      title: "Choix rapide selon la tâche",
      bullets: [
        { text: "Besoin de coder dans le projet → Cursor" },
        { text: "Besoin de réfléchir / spécifier → Claude" },
        { text: "Besoin d'un bout de code isolé → Codex" },
        { text: "Besoin de sauver / collab → GitHub" },
      ],
      illustration: "tools-grid",
      notes: "Faire voter la salle : « pour un bug UI, quel outil ? »",
    }),

    // —— Exemples pratiques ——
    s({
      id: "examples-section",
      layout: "section",
      palette: "amber",
      eyebrow: "Pratique",
      title: "Exemples guidés",
      subtitle: "Trois prompts que vous pouvez rejouer dès ce soir",
      illustration: "prompt-craft",
    }),
    s({
      id: "ex-1",
      layout: "content",
      palette: "amber",
      eyebrow: "Exemple 1 · Comprendre",
      title: "« Explique ce fichier »",
      body: [
        "Dans Cursor, sélectionnez un fichier clé du projet et demandez :",
      ],
      bullets: [
        { text: "Ouvre [chemin] et explique son rôle en 5 points" },
        { text: "Liste les dépendances critiques de ce module" },
        { text: "Signale ce qui serait risqué à modifier sans tests" },
      ],
      illustration: "cursor",
      notes: "Montrer qu'on commence toujours par comprendre, pas par générer.",
    }),
    s({
      id: "ex-2",
      layout: "content",
      palette: "amber",
      eyebrow: "Exemple 2 · Construire",
      title: "« Ajoute une page minimale »",
      body: [
        "Prompt type pour une feature UI dans un projet Next.js :",
      ],
      bullets: [
        { text: "Crée une page /demo avec titre, lede et un bouton CTA" },
        { text: "Réutilise les composants et tokens déjà présents" },
        { text: "N'ajoute aucune dépendance npm sans me le demander" },
        { text: "Montre le diff avant d'écrire ailleurs" },
      ],
      illustration: "build-stack",
    }),
    s({
      id: "ex-3",
      layout: "content",
      palette: "amber",
      eyebrow: "Exemple 3 · Multi-fichiers",
      title: "Workflow agentique propre",
      bullets: [
        { text: "Décrire le résultat utilisateur (pas le code)" },
        { text: "Lister les fichiers touchés attendus" },
        { text: "Demander un plan court avant l'implémentation" },
        { text: "Appliquer, tester manuellement, puis commit GitHub" },
      ],
      illustration: "git-flow",
    }),
    s({
      id: "ex-anti",
      layout: "content",
      palette: "coral",
      eyebrow: "Anti-patterns",
      title: "À éviter dès le Module 1",
      bullets: [
        { text: "« Fais-moi toute l'app » en un seul prompt" },
        { text: "Accepter un diff sans le lire" },
        { text: "Coller des clés API dans le chat public" },
        { text: "Committer node_modules ou .env" },
      ],
      illustration: "security",
    }),

    // —— Quiz ——
    s({
      id: "quiz-section",
      layout: "section",
      palette: "indigo",
      eyebrow: "Évaluation formative",
      title: "Quiz Module 1",
      subtitle: "5 questions - Espace pour révéler la bonne réponse",
      illustration: "quiz",
    }),
    s({
      id: "quiz-1",
      layout: "quiz",
      palette: "indigo",
      eyebrow: "Question 1 / 5",
      title: "Vibe Coding",
      quiz: {
        question:
          "Quelle affirmation décrit le mieux le Vibe Coding ?",
        options: [
          {
            id: "a",
            text: "Laisser l'IA coder seule sans relecture",
          },
          {
            id: "b",
            text: "Dialoguer avec l'IA pour accélérer, sous supervision humaine",
            correct: true,
          },
          {
            id: "c",
            text: "Remplacer GitHub par le chat de l'IA",
          },
          {
            id: "d",
            text: "Uniquement du no-code sans fichiers",
          },
        ],
        explanation:
          "Le Vibe Coding = intention humaine + accélération IA + review obligatoire.",
      },
      illustration: "quiz",
    }),
    s({
      id: "quiz-2",
      layout: "quiz",
      palette: "indigo",
      eyebrow: "Question 2 / 5",
      title: "Choix d'outil",
      quiz: {
        question:
          "Vous devez modifier 4 fichiers d'un projet Next.js déjà ouvert. Quel outil est le plus adapté ?",
        options: [
          { id: "a", text: "Claude seul, hors IDE", correct: false },
          { id: "b", text: "Cursor (Composer / agent)", correct: true },
          { id: "c", text: "GitHub Issues uniquement", correct: false },
          { id: "d", text: "Un éditeur de texte sans IA", correct: false },
        ],
        explanation:
          "Cursor opère dans le contexte du repo et applique des diffs multi-fichiers.",
      },
      illustration: "cursor",
    }),
    s({
      id: "quiz-3",
      layout: "quiz",
      palette: "indigo",
      eyebrow: "Question 3 / 5",
      title: "Claude",
      quiz: {
        question: "Claude est surtout utile pour…",
        options: [
          {
            id: "a",
            text: "Héberger le dépôt de production",
          },
          {
            id: "b",
            text: "Cadrer, spécifier et raisonner avant de coder",
            correct: true,
          },
          {
            id: "c",
            text: "Remplacer les commits Git",
          },
          {
            id: "d",
            text: "Scanner les badges speakers",
          },
        ],
        explanation:
          "Claude = raisonnement / specs. Cursor = exécution dans le code.",
      },
      illustration: "claude",
    }),
    s({
      id: "quiz-4",
      layout: "quiz",
      palette: "indigo",
      eyebrow: "Question 4 / 5",
      title: "GitHub",
      quiz: {
        question: "Pourquoi GitHub est-il indispensable au hackathon ?",
        options: [
          {
            id: "a",
            text: "Parce que le jury note uniquement le design Figma",
          },
          {
            id: "b",
            text: "Pour versionner, sauvegarder et collaborer sur le code",
            correct: true,
          },
          {
            id: "c",
            text: "Pour stocker les clés API en clair",
          },
          {
            id: "d",
            text: "Parce que Cursor ne fonctionne pas sans",
          },
        ],
        explanation:
          "GitHub = mémoire d'équipe + preuve de travail + continuité.",
      },
      illustration: "github",
    }),
    s({
      id: "quiz-5",
      layout: "quiz",
      palette: "indigo",
      eyebrow: "Question 5 / 5",
      title: "Sécurité",
      quiz: {
        question: "Quelle pratique est correcte dès le Module 1 ?",
        options: [
          {
            id: "a",
            text: "Committer le fichier .env pour que l'équipe l'ait",
          },
          {
            id: "b",
            text: "Coller la clé API dans un prompt public",
          },
          {
            id: "c",
            text: "Garder les secrets en local et les ignorer dans Git",
            correct: true,
          },
          {
            id: "d",
            text: "Désactiver la review des diffs pour aller plus vite",
          },
        ],
        explanation:
          "Secrets hors repo. Review humaine. Toujours.",
      },
      illustration: "security",
    }),

    // —— Devoir ——
    s({
      id: "homework",
      layout: "homework",
      palette: "mint",
      eyebrow: "Devoir Module 1",
      title: "À rendre avant la prochaine session",
      homework: {
        deadlineHint: "Avant le Module 2 - prompts",
        tasks: [
          "Installer Cursor et se connecter avec un compte valide",
          "Créer un dépôt GitHub vide (ou fork d'un starter) et le cloner en local",
          "Ouvrir le projet dans Cursor et demander : « Explique la structure du repo en 8 puces »",
          "Faire un premier commit : README avec ton nom, ton équipe (si connue) et ton objectif hackathon",
          "Capturer une capture d'écran du chat Cursor + du repo GitHub - à montrer demain",
        ],
      },
      illustration: "homework",
      notes: "Rappeler : pas de secrets dans les captures.",
    }),

    // —— Stubs modules suivants ——
    s({
      id: "roadmap-next",
      layout: "section",
      palette: "slate",
      eyebrow: "Suite du parcours",
      title: "Modules à venir",
      subtitle: "Stubs prêts - contenu détaillé dans les prochaines sessions",
      illustration: "agenda",
    }),
    s({
      id: "stub-m2",
      layout: "content",
      palette: "amber",
      eyebrow: "Module 2",
      title: "Maîtriser les prompts pour développer avec l'IA",
      bullets: [
        { text: "Comment donner de bonnes instructions" },
        { text: "Conserver le contexte sur plusieurs tours" },
        { text: "Décomposer une tâche complexe" },
      ],
      illustration: "prompt-craft",
    }),
    s({
      id: "stub-m3",
      layout: "content",
      palette: "violet",
      eyebrow: "Module 3",
      title: "De l'idée au cahier des charges",
      bullets: [
        { text: "Transformer une idée en projet concret" },
        { text: "User stories, contraintes, critères de succès" },
        { text: "Valider le scope avant de coder" },
      ],
      illustration: "idea-to-spec",
    }),
    s({
      id: "stub-m4",
      layout: "content",
      palette: "sky",
      eyebrow: "Module 4",
      title: "Construire une application avec l'IA",
      bullets: [
        { text: "Frontend, backend, base de données, API" },
        { text: "Brancher les fonctionnalités du défi" },
        { text: "Itérer vers une démo crédible" },
      ],
      illustration: "build-stack",
    }),
    s({
      id: "stub-m5",
      layout: "content",
      palette: "coral",
      eyebrow: "Module 5",
      title: "Déboguer et améliorer avec l'IA",
      bullets: [
        { text: "Lire les erreurs et les stack traces" },
        { text: "Tests, refactoring, optimisation" },
        { text: "Ne jamais « patcher à l'aveugle »" },
      ],
      illustration: "debug",
    }),
    s({
      id: "stub-m6",
      layout: "content",
      palette: "slate",
      eyebrow: "Module 6",
      title: "Git, GitHub et gestion du projet",
      bullets: [
        { text: "Versions, commits, branches" },
        { text: "Sauvegarde et collaboration d'équipe" },
        { text: "Préparer le repo pour le jury" },
      ],
      illustration: "git-flow",
    }),
    s({
      id: "stub-m7",
      layout: "content",
      palette: "coral",
      eyebrow: "Module 7",
      title: "Sécurité et bonnes pratiques du Vibe Coding",
      bullets: [
        { text: "Données sensibles et clés API" },
        { text: "Dépendances et code généré par l'IA" },
        { text: "Checklist avant Demo Day" },
      ],
      illustration: "security",
    }),
    s({
      id: "stub-m8",
      layout: "content",
      palette: "forest",
      eyebrow: "Module 8",
      title: "Projet final",
      bullets: [
        { text: "Chaque participant construit une app de A à Z" },
        { text: "Mentorat et itérations ciblées" },
        { text: "Livrables : démo, repo, pitch" },
      ],
      illustration: "project",
    }),
    s({
      id: "stub-eval",
      layout: "content",
      palette: "mint",
      eyebrow: "Clôture du parcours",
      title: "Évaluation finale + présentation des projets",
      bullets: [
        { text: "Démonstration en visioconférence ou sur scène" },
        { text: "Évaluation du projet (innovation, impact, technique…)" },
        { text: "Feedback jury et suite incubation" },
      ],
      illustration: "eval",
    }),

    s({
      id: "closing",
      layout: "closing",
      palette: "mint",
      eyebrow: "McBuleli Hackathon",
      title: "Prêts pour le Module 1 en action",
      subtitle:
        "Ouvrez Cursor. Clonez. Prompt. Review. Commit. On se retrouve On Air.",
      bullets: [
        { text: "Répéter sur /hackathon/slides" },
        { text: "Diffuser sur /hackathon/live (mode projecteur)" },
        { text: "Continuer dans /hackathon/espace" },
      ],
      ctas: [
        { label: "Live", href: "/hackathon/live" },
        { label: "Mon espace", href: "/hackathon/espace" },
      ],
      illustration: "vibe-loop",
      notes: "Remercier. Lancer le devoir. Proposer Q&A 5 min.",
    }),
  ],
};
