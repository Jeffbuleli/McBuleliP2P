import type { HackathonDeck, HackathonSlide } from "@/lib/hackathon/slides/types";

/** Public deck copy — regenerated via OpenAI (bootcamp / international training tone).
 *  Speaker-only guidance lives in `notes` (prepare mode only).
 */
function s(partial: HackathonSlide): HackathonSlide {
  return partial;
}

export const vibeCodingMasterclassDeck: HackathonDeck = {
  slug: "vibe-coding-masterclass",
  titleFr: "Masterclass Vibe Coding",
  titleEn: "Vibe Coding Masterclass",
  descriptionFr:
    "Bootcamp pratique · 55 min : Vibe Coding + Module 1 (Cursor, Claude, Codex, GitHub).",
  descriptionEn:
    "Hands-on bootcamp · 55 min: Vibe Coding + Module 1 (Cursor, Claude, Codex, GitHub).",
  moduleLabelFr: "Module 1 · Outils",
  moduleLabelEn: "Module 1 · Tools",
  estimatedMinutes: 55,
  speakerHintFr:
    "Mode préparer uniquement : ← → · Espace quiz · N notes · F plein écran · L On Air.",
  speakerHintEn:
    "Prepare mode only: ← → · Space quiz · N notes · F fullscreen · L On Air.",
  slides: [
    s({
      id: "cover",
      layout: "title",
      palette: "mint",
      eyebrow: "McBuleli Hackathon · Silikin Village · 28 août 2026",
      title: "Masterclass Vibe Coding",
      subtitle: "55 min · intention → code → review → commit — avec Ir Jeff Buleli.",
      bullets: [
        {
          text: "On code",
          detail: "Chaque notion se traduit en action dans un vrai projet.",
        },
        {
          text: "On review",
          detail: "Lire le diff avant d’accepter : l’IA propose, vous décidez.",
        },
        {
          text: "On commit",
          detail: "Une avancée claire dans GitHub vaut mieux qu’un long chat.",
        },
      ],
      illustration: "vibe-loop",
      notes: "Rappel : positionner la session comme un atelier pratique et exigeant.",
    }),
    s({
      id: "speaker",
      layout: "split",
      palette: "slate",
      eyebrow: "Formateur",
      title: "Ir Jeff Buleli",
      subtitle: "Fondateur et développeur principal de McBuleli",
      body: [
        "Une session pour transformer une intention produit en code vérifiable, versionné et prêt à évoluer.",
      ],
      bullets: [
        {
          text: "Approche terrain",
          detail: "Chaque concept doit mener à une action concrète dans le projet.",
        },
        {
          text: "IA utile",
          detail: "L’IA accélère la réflexion, mais la responsabilité technique reste humaine.",
        },
        {
          text: "Livrable d’abord",
          detail: "Le bon résultat se voit dans le dépôt, le code et la clarté des commits.",
        },
      ],
      portrait: {
        src: "/hackathon/jeff-buleli.png",
        alt: "Portrait de Ir Jeff Buleli",
        caption: "Ir Jeff Buleli · McBuleli",
      },
      notes: "Rappel : garder un ton direct, professionnel et orienté livraison.",
    }),
    s({
      id: "why-here",
      layout: "content",
      palette: "forest",
      title: "Pourquoi ici, pourquoi maintenant",
      subtitle: "Le hackathon récompense la vitesse maîtrisée.",
      bullets: [
        {
          text: "Passer de l’idée au prototype",
          detail: "Une bonne idée gagne en valeur quand elle devient testable rapidement.",
        },
        {
          text: "Réduire le temps perdu",
          detail: "Les outils IA aident à clarifier, générer, corriger et documenter.",
        },
        {
          text: "Garder un standard pro",
          detail: "Même sous pression, le code doit rester lisible, reviewable et versionné.",
        },
      ],
      illustration: "project",
      notes: "Rappel : relier les outils au contexte compétitif du hackathon.",
    }),
    s({
      id: "agenda",
      layout: "agenda",
      palette: "slate",
      title: "Agenda · 55 minutes",
      subtitle: "Comprendre, pratiquer, valider.",
      agenda: [
        {
          num: 1,
          title: "Pourquoi maintenant",
          subtitle: "Coder plus vite, mieux cadrer, livrer.",
        },
        {
          num: 2,
          title: "Objectifs",
          subtitle: "Ce que vous saurez faire aujourd’hui.",
        },
        {
          num: 3,
          title: "Définition",
          subtitle: "Le Vibe Coding en une phrase.",
        },
        {
          num: 4,
          title: "Principes",
          subtitle: "Intention, boucle, validation.",
        },
        {
          num: 5,
          title: "Forces et limites",
          subtitle: "Accélérer sans perdre le contrôle.",
        },
        {
          num: 6,
          title: "Rôle de l’IA",
          subtitle: "Copilote, pas pilote automatique.",
        },
        {
          num: 7,
          title: "Module 1 · Outils",
          subtitle: "Cursor, Claude, Codex, GitHub.",
          highlight: true,
        },
        {
          num: 8,
          title: "Exemples",
          subtitle: "Prompts, specs, bugs, commits.",
        },
        {
          num: 9,
          title: "Quiz",
          subtitle: "5 questions pour valider.",
        },
        {
          num: 10,
          title: "Travail personnel",
          subtitle: "Préparer le prochain module.",
        },
      ],
      illustration: "agenda",
      notes: "Rappel : maintenir le rythme et annoncer que le Module 1 est le cœur pratique.",
    }),
    s({
      id: "learning-goals",
      layout: "content",
      palette: "mint",
      title: "Objectifs d’apprentissage",
      subtitle: "À la fin, vous devez pouvoir agir.",
      bullets: [
        {
          text: "Définir le Vibe Coding",
          detail: "Expliquer la méthode sans la confondre avec du copier-coller IA.",
        },
        {
          text: "Choisir le bon outil",
          detail: "Associer Cursor, Claude, Codex et GitHub à leurs usages forts.",
        },
        {
          text: "Construire une boucle fiable",
          detail: "Prompt, génération, review, test, commit.",
        },
        {
          text: "Éviter les pièges",
          detail: "Sécurité, hallucinations, dette technique et dépendance excessive.",
        },
      ],
      illustration: "eval",
      notes: "Rappel : mesurer la compréhension par la capacité à produire un commit propre.",
    }),
    s({
      id: "intro-section",
      layout: "section",
      palette: "violet",
      title: "Introduction · Vibe Coding",
      subtitle: "Coder avec intention, contexte et validation.",
      body: [
        "Le Vibe Coding n’est pas une magie. C’est une discipline de collaboration avec l’IA.",
      ],
      illustration: "vibe-loop",
      notes: "Rappel : poser un cadre simple avant de parler des outils.",
    }),
    s({
      id: "intro-definition",
      layout: "split",
      palette: "violet",
      title: "Définition simple",
      subtitle: "Transformer une intention claire en code vérifié.",
      body: [
        "Le Vibe Coding consiste à guider l’IA avec du contexte, puis à contrôler le résultat comme un développeur responsable.",
      ],
      bullets: [
        {
          text: "Intention",
          detail: "Ce que l’utilisateur veut accomplir et pourquoi.",
        },
        {
          text: "Contexte",
          detail: "Le code existant, les contraintes, les données et les règles métier.",
        },
        {
          text: "Validation",
          detail: "La preuve que le résultat fonctionne et reste maintenable.",
        },
      ],
      illustration: "idea-to-spec",
      notes: "Rappel : distinguer clairement vitesse et précipitation.",
    }),
    s({
      id: "intro-principles",
      layout: "steps",
      palette: "violet",
      title: "Les 5 principes",
      subtitle: "Une boucle courte, mais contrôlée.",
      steps: [
        {
          num: 1,
          title: "Cadrer",
          body: "Décrire le besoin, le résultat attendu et les limites.",
        },
        {
          num: 2,
          title: "Demander",
          body: "Formuler une requête précise, ancrée dans le projet.",
        },
        {
          num: 3,
          title: "Générer",
          body: "Obtenir une proposition de code, de plan ou de correction.",
        },
        {
          num: 4,
          title: "Vérifier",
          body: "Lire, tester, comparer et refuser ce qui est fragile.",
        },
        {
          num: 5,
          title: "Committer",
          body: "Sauvegarder une avancée claire dans l’historique Git.",
        },
      ],
      illustration: "vibe-loop",
      notes: "Rappel : présenter la boucle comme un réflexe à répéter tout le hackathon.",
    }),
    s({
      id: "intro-advantages",
      layout: "content",
      palette: "forest",
      title: "Ce que le Vibe Coding accélère",
      subtitle: "Moins de friction, plus d’itérations.",
      bullets: [
        {
          text: "Démarrage rapide",
          detail: "Créer une structure, une page, une API ou un test plus vite.",
        },
        {
          text: "Exploration guidée",
          detail: "Comparer plusieurs approches avant d’écrire trop de code.",
        },
        {
          text: "Debug assisté",
          detail: "Analyser une erreur, isoler une cause et proposer une correction.",
        },
        {
          text: "Documentation utile",
          detail: "Produire des README, specs et notes techniques plus cohérents.",
        },
      ],
      illustration: "build-stack",
      notes: "Rappel : valoriser les gains visibles dans un sprint court.",
    }),
    s({
      id: "intro-limits",
      layout: "content",
      palette: "coral",
      title: "Ce que le Vibe Coding ne remplace pas",
      subtitle: "L’IA peut générer, pas garantir.",
      bullets: [
        {
          text: "Le jugement technique",
          detail: "Un code plausible peut rester faux, lent ou dangereux.",
        },
        {
          text: "La compréhension métier",
          detail: "L’IA ne connaît pas vos utilisateurs sans contexte clair.",
        },
        {
          text: "La sécurité",
          detail: "Les secrets, permissions et données sensibles exigent une revue stricte.",
        },
        {
          text: "La responsabilité",
          detail: "Le commit porte votre nom, même si l’IA a proposé le code.",
        },
      ],
      illustration: "limits",
      notes: "Rappel : ancrer la prudence sans décourager l’expérimentation.",
    }),
    s({
      id: "intro-ai-role",
      layout: "split",
      palette: "indigo",
      title: "Le bon rôle de l’IA",
      subtitle: "Copilote de raisonnement et de production.",
      body: [
        "L’IA aide à penser, écrire et corriger. Le développeur décide, valide et assume.",
      ],
      bullets: [
        {
          text: "Assistant de cadrage",
          detail: "Transformer une idée vague en tâches techniques.",
        },
        {
          text: "Pair-programmer",
          detail: "Proposer du code, des alternatives et des tests.",
        },
        {
          text: "Reviewer initial",
          detail: "Repérer incohérences, oublis et risques évidents.",
        },
      ],
      illustration: "ai-role",
      notes: "Rappel : répéter que l’IA augmente l’équipe, elle ne remplace pas la revue.",
    }),
    s({
      id: "m1-section",
      layout: "section",
      palette: "sky",
      title: "Module 1 · Les outils",
      subtitle: "Cursor, Claude, Codex, GitHub.",
      body: [
        "Un bon workflow combine génération, raisonnement, automatisation et versioning.",
      ],
      illustration: "tools-grid",
      notes: "Rappel : ouvrir la partie pratique avec une vision d’ensemble.",
    }),
    s({
      id: "m1-map",
      layout: "tools",
      palette: "sky",
      title: "Carte des outils",
      subtitle: "Chaque outil a un rôle précis.",
      tools: [
        {
          id: "cursor",
          name: "Cursor",
          role: "Coder dans le projet",
          detail:
            "Idéal pour modifier des fichiers avec le contexte du dépôt.",
          accent: "sky",
        },
        {
          id: "claude",
          name: "Claude",
          role: "Raisonner et structurer",
          detail:
            "Utile pour clarifier une spec, analyser un problème ou préparer un plan.",
          accent: "amber",
        },
        {
          id: "codex",
          name: "Codex",
          role: "Générer et expliquer",
          detail:
            "Pratique pour produire du code, proposer des tests et détailler une solution.",
          accent: "indigo",
        },
        {
          id: "github",
          name: "GitHub",
          role: "Versionner et collaborer",
          detail:
            "Base du travail en équipe, des commits, des branches et des revues.",
          accent: "slate",
        },
      ],
      illustration: "tools-grid",
      notes: "Rappel : présenter les outils comme complémentaires, pas concurrents.",
    }),
    s({
      id: "m1-cursor",
      layout: "split",
      palette: "sky",
      title: "Cursor",
      subtitle: "L’éditeur pour coder avec contexte.",
      body: [
        "Cursor place l’assistance IA au cœur du projet : fichiers, composants, erreurs et refactors.",
      ],
      bullets: [
        {
          text: "Modifier le code existant",
          detail: "Demander une amélioration ciblée sur une fonction, une page ou un composant.",
        },
        {
          text: "Comprendre une base",
          detail: "Résumer le rôle d’un dossier ou d’un fichier avant d’intervenir.",
        },
        {
          text: "Refactorer proprement",
          detail: "Réduire la duplication sans changer le comportement attendu.",
        },
      ],
      illustration: "cursor",
      notes: "Rappel : associer Cursor à l’action directe dans le dépôt.",
    }),
    s({
      id: "m1-claude",
      layout: "split",
      palette: "amber",
      title: "Claude",
      subtitle: "Le partenaire de clarification.",
      body: [
        "Claude est fort pour structurer les idées, challenger les hypothèses et produire des explications lisibles.",
      ],
      bullets: [
        {
          text: "Transformer une idée en spec",
          detail: "Décrire utilisateurs, parcours, contraintes et critères d’acceptation.",
        },
        {
          text: "Comparer des options",
          detail: "Évaluer deux architectures ou deux approches produit.",
        },
        {
          text: "Préparer une review",
          detail: "Lister les risques, les cas limites et les questions ouvertes.",
        },
      ],
      illustration: "claude",
      notes: "Rappel : associer Claude à la qualité du raisonnement avant le code.",
    }),
    s({
      id: "m1-codex",
      layout: "split",
      palette: "indigo",
      title: "Codex",
      subtitle: "Générer, corriger, expliquer.",
      body: [
        "Codex aide à produire du code et à explorer rapidement des solutions techniques.",
      ],
      bullets: [
        {
          text: "Créer une première version",
          detail: "Obtenir un composant, une route API ou une fonction de traitement.",
        },
        {
          text: "Ajouter des tests",
          detail: "Couvrir les cas normaux, les erreurs et les limites.",
        },
        {
          text: "Expliquer une solution",
          detail: "Comprendre le comportement avant de l’intégrer.",
        },
      ],
      illustration: "codex",
      notes: "Rappel : relier Codex à la production contrôlée, jamais à l’acceptation automatique.",
    }),
    s({
      id: "m1-github",
      layout: "split",
      palette: "slate",
      title: "GitHub",
      subtitle: "La mémoire du projet.",
      body: [
        "GitHub rend le travail visible, traçable et collaboratif.",
      ],
      bullets: [
        {
          text: "Commits lisibles",
          detail: "Chaque commit doit raconter une avancée précise.",
        },
        {
          text: "Branches maîtrisées",
          detail: "Isoler une fonctionnalité pour limiter les conflits.",
        },
        {
          text: "Revues utiles",
          detail: "Comparer le code, discuter les choix et corriger avant fusion.",
        },
      ],
      illustration: "github",
      notes: "Rappel : rappeler que le dépôt est la preuve du travail réalisé.",
    }),
    s({
      id: "m1-workspace",
      layout: "steps",
      palette: "mint",
      title: "Workflow minimal",
      subtitle: "Une boucle simple pour le hackathon.",
      steps: [
        {
          num: 1,
          title: "Décrire",
          body: "Écrire le besoin et le résultat attendu.",
        },
        {
          num: 2,
          title: "Générer",
          body: "Obtenir une proposition de code ou de plan.",
        },
        {
          num: 3,
          title: "Relire",
          body: "Vérifier logique, sécurité, style et dépendances.",
        },
        {
          num: 4,
          title: "Tester",
          body: "Confirmer le comportement avec des cas simples.",
        },
        {
          num: 5,
          title: "Committer",
          body: "Sauvegarder une étape stable et compréhensible.",
        },
      ],
      illustration: "workspace",
      notes: "Rappel : présenter cette boucle comme la base de toutes les sessions suivantes.",
    }),
    s({
      id: "m1-compare",
      layout: "content",
      palette: "sky",
      title: "Quel outil pour quel moment ?",
      subtitle: "Choisir selon le besoin immédiat.",
      bullets: [
        {
          text: "Besoin flou → Claude",
          detail: "Clarifier le problème avant d’écrire.",
        },
        {
          text: "Code à modifier → Cursor",
          detail: "Travailler directement dans le contexte du projet.",
        },
        {
          text: "Solution à générer → Codex",
          detail: "Produire une première version ou des tests.",
        },
        {
          text: "Travail à partager → GitHub",
          detail: "Versionner, relire et collaborer.",
        },
      ],
      illustration: "tools-grid",
      notes: "Rappel : encourager un choix d’outil basé sur la tâche, pas sur la préférence.",
    }),
    s({
      id: "examples-section",
      layout: "section",
      palette: "amber",
      title: "Exemples pratiques",
      subtitle: "Des prompts qui mènent à du code utile.",
      body: [
        "Un bon prompt donne un contexte, une tâche et un critère de réussite.",
      ],
      illustration: "prompt-craft",
      notes: "Rappel : faire sentir la différence entre demande vague et demande exploitable.",
    }),
    s({
      id: "ex-1",
      layout: "content",
      palette: "amber",
      title: "Exemple 1 · Idée vers spec",
      subtitle: "Avant de coder, cadrer.",
      bullets: [
        {
          text: "Contexte",
          detail: "Application de suivi de dépenses pour étudiants à Kinshasa.",
        },
        {
          text: "Demande",
          detail: "Définir les 3 parcours clés, les données nécessaires et les critères d’acceptation.",
        },
        {
          text: "Résultat attendu",
          detail: "Une spec courte qui peut devenir des tâches GitHub.",
        },
      ],
      illustration: "idea-to-spec",
      notes: "Rappel : souligner que la spec réduit les mauvaises générations de code.",
    }),
    s({
      id: "ex-2",
      layout: "content",
      palette: "amber",
      title: "Exemple 2 · Spec vers composant",
      subtitle: "Coder une première brique.",
      bullets: [
        {
          text: "Contexte",
          detail: "Une page doit afficher une liste de transactions filtrable.",
        },
        {
          text: "Demande",
          detail: "Créer un composant simple avec état, filtre et message quand la liste est vide.",
        },
        {
          text: "Validation",
          detail: "Le composant reste lisible et couvre les cas principaux.",
        },
      ],
      illustration: "build-stack",
      notes: "Rappel : relier le prompt au composant concret produit dans le projet.",
    }),
    s({
      id: "ex-3",
      layout: "content",
      palette: "amber",
      title: "Exemple 3 · Bug vers correction",
      subtitle: "Analyser avant de patcher.",
      bullets: [
        {
          text: "Symptôme",
          detail: "Le total affiché ne change pas après suppression d’une transaction.",
        },
        {
          text: "Demande",
          detail: "Identifier les causes probables et proposer une correction minimale.",
        },
        {
          text: "Preuve",
          detail: "Ajouter un test ou un cas manuel qui confirme la correction.",
        },
      ],
      illustration: "debug",
      notes: "Rappel : rappeler que la correction doit être prouvée, pas seulement plausible.",
    }),
    s({
      id: "ex-anti",
      layout: "content",
      palette: "coral",
      title: "Anti-exemples",
      subtitle: "Ce qui produit du mauvais code.",
      bullets: [
        {
          text: "Prompt vague",
          detail: "« Fais mon app » donne souvent une réponse générique et inutilisable.",
        },
        {
          text: "Acceptation aveugle",
          detail: "Coller du code sans lecture crée des bugs difficiles à expliquer.",
        },
        {
          text: "Contexte absent",
          detail: "Sans structure du projet, l’IA invente noms, fichiers et dépendances.",
        },
        {
          text: "Commit géant",
          detail: "Une grosse modification non découpée devient presque impossible à reviewer.",
        },
      ],
      illustration: "limits",
      notes: "Rappel : transformer les erreurs courantes en règles simples à éviter.",
    }),
    s({
      id: "quiz-section",
      layout: "section",
      palette: "indigo",
      title: "Quiz rapide",
      subtitle: "5 questions, une bonne réponse chacune.",
      body: [
        "Objectif : vérifier les réflexes essentiels avant de passer à la suite.",
      ],
      illustration: "quiz",
      notes: "Rappel : garder le quiz court et centré sur les décisions pratiques.",
    }),
    s({
      id: "quiz-1",
      layout: "quiz",
      palette: "indigo",
      title: "Quiz 1",
      quiz: {
        question: "Quelle phrase décrit le mieux le Vibe Coding ?",
        options: [
          {
            id: "a",
            text: "Laisser l’IA coder sans intervention humaine.",
          },
          {
            id: "b",
            text: "Guider l’IA avec contexte, puis vérifier le code.",
            correct: true,
          },
          {
            id: "c",
            text: "Remplacer GitHub par un assistant IA.",
          },
          {
            id: "d",
            text: "Écrire uniquement des prompts, jamais de tests.",
          },
        ],
        explanation: "Le Vibe Coding combine intention claire, assistance IA et validation humaine.",
      },
      illustration: "quiz",
      notes: "Rappel : valoriser la notion de contrôle humain.",
      eyebrow: "Question 1 / 5",
    }),
    s({
      id: "quiz-2",
      layout: "quiz",
      palette: "indigo",
      title: "Quiz 2",
      quiz: {
        question: "Quel outil est le plus adapté pour modifier du code dans le contexte du projet ?",
        options: [
          {
            id: "a",
            text: "Cursor",
            correct: true,
          },
          {
            id: "b",
            text: "Claude",
          },
          {
            id: "c",
            text: "GitHub",
          },
          {
            id: "d",
            text: "Un tableur",
          },
        ],
        explanation: "Cursor est conçu pour travailler directement dans les fichiers du projet.",
      },
      illustration: "quiz",
      notes: "Rappel : relier l’outil à la tâche concrète.",
      eyebrow: "Question 2 / 5",
    }),
    s({
      id: "quiz-3",
      layout: "quiz",
      palette: "indigo",
      title: "Quiz 3",
      quiz: {
        question: "Quel est le meilleur réflexe avant d’accepter du code généré ?",
        options: [
          {
            id: "a",
            text: "Le committer immédiatement.",
          },
          {
            id: "b",
            text: "Le relire, le tester et vérifier son impact.",
            correct: true,
          },
          {
            id: "c",
            text: "Supprimer l’historique Git.",
          },
          {
            id: "d",
            text: "Changer tout le projet pour l’adapter.",
          },
        ],
        explanation: "La validation évite les bugs plausibles et les changements dangereux.",
      },
      illustration: "quiz",
      notes: "Rappel : ramener la réponse à la responsabilité du développeur.",
      eyebrow: "Question 3 / 5",
    }),
    s({
      id: "quiz-4",
      layout: "quiz",
      palette: "indigo",
      title: "Quiz 4",
      quiz: {
        question: "À quoi sert principalement GitHub dans ce workflow ?",
        options: [
          {
            id: "a",
            text: "Remplacer les tests.",
          },
          {
            id: "b",
            text: "Versionner, collaborer et reviewer.",
            correct: true,
          },
          {
            id: "c",
            text: "Générer automatiquement toute l’application.",
          },
          {
            id: "d",
            text: "Cacher les erreurs.",
          },
        ],
        explanation: "GitHub garde la trace du travail et facilite la collaboration.",
      },
      illustration: "quiz",
      notes: "Rappel : rappeler que l’historique est un actif du projet.",
      eyebrow: "Question 4 / 5",
    }),
    s({
      id: "quiz-5",
      layout: "quiz",
      palette: "indigo",
      title: "Quiz 5",
      quiz: {
        question: "Quel prompt est le plus exploitable ?",
        options: [
          {
            id: "a",
            text: "« Code une app complète. »",
          },
          {
            id: "b",
            text: "« Fais quelque chose de moderne. »",
          },
          {
            id: "c",
            text: "« Crée un composant de filtre pour transactions avec état vide et critères de test. »",
            correct: true,
          },
          {
            id: "d",
            text: "« Corrige tout. »",
          },
        ],
        explanation: "Le prompt donne une tâche précise, un contexte fonctionnel et un critère de validation.",
      },
      illustration: "quiz",
      notes: "Rappel : conclure le quiz sur la qualité du cadrage.",
      eyebrow: "Question 5 / 5",
    }),
    s({
      id: "homework",
      layout: "homework",
      palette: "mint",
      title: "Travail à faire",
      subtitle: "Préparer votre environnement et votre première boucle.",
      homework: {
        deadlineHint: "Préparer votre environnement et votre première boucle.",
        tasks: [
          "Créer votre dépôt GitHub — Ajoutez un README avec le nom du projet, le problème ciblé et l’équipe.",
          "Écrire votre spec courte — Décrivez 3 fonctionnalités, 3 critères d’acceptation et 3 risques.",
          "Préparer votre workspace — Ouvrez le projet dans votre éditeur et vérifiez que vous pouvez lancer l’application.",
          "Faire un premier commit propre — Versionnez une base minimale : README, structure et notes de démarrage.",
        ],
      },
      illustration: "homework",
      notes: "Rappel : le travail personnel doit produire des traces vérifiables.",
    }),
    s({
      id: "roadmap-next",
      layout: "section",
      palette: "slate",
      title: "La suite du parcours",
      subtitle: "Des outils vers un projet complet.",
      body: [
        "Les prochains modules transforment votre idée en produit démontrable.",
      ],
      illustration: "project",
      notes: "Rappel : donner une vision motivante des modules suivants.",
    }),
    s({
      id: "stub-m2",
      layout: "content",
      palette: "amber",
      title: "Module 2 · Prompt Craft",
      subtitle: "Écrire des demandes qui produisent de bons résultats.",
      bullets: [
        {
          text: "Contexte utile",
          detail: "Fournir objectif, contraintes, fichiers concernés et résultat attendu.",
        },
        {
          text: "Sortie contrôlée",
          detail: "Demander un format clair : plan, code, checklist ou tests.",
        },
        {
          text: "Itération courte",
          detail: "Améliorer le prompt après chaque réponse au lieu de tout demander d’un coup.",
        },
      ],
      illustration: "prompt-craft",
      notes: "Rappel : présenter le prompt comme une compétence d’ingénierie.",
    }),
    s({
      id: "stub-m3",
      layout: "content",
      palette: "violet",
      title: "Module 3 · Idée vers spec",
      subtitle: "Clarifier avant de construire.",
      bullets: [
        {
          text: "Problème utilisateur",
          detail: "Identifier qui souffre, dans quelle situation et avec quel enjeu.",
        },
        {
          text: "Parcours principal",
          detail: "Décrire le chemin minimal qui crée de la valeur.",
        },
        {
          text: "Critères d’acceptation",
          detail: "Définir ce qui prouve qu’une fonctionnalité est terminée.",
        },
      ],
      illustration: "idea-to-spec",
      notes: "Rappel : relier la spec à la réduction du gaspillage de code.",
    }),
    s({
      id: "stub-m4",
      layout: "content",
      palette: "sky",
      title: "Module 4 · Build Stack",
      subtitle: "Construire une base technique solide.",
      bullets: [
        {
          text: "Architecture minimale",
          detail: "Choisir une structure simple, adaptée au prototype.",
        },
        {
          text: "Composants réutilisables",
          detail: "Découper l’interface pour éviter les fichiers énormes.",
        },
        {
          text: "Tests essentiels",
          detail: "Couvrir les comportements critiques avant la démo.",
        },
      ],
      illustration: "build-stack",
      notes: "Rappel : orienter le module vers la simplicité robuste.",
    }),
    s({
      id: "stub-m5",
      layout: "content",
      palette: "coral",
      title: "Module 5 · Debug assisté",
      subtitle: "Corriger avec méthode.",
      bullets: [
        {
          text: "Symptôme clair",
          detail: "Décrire ce qui se passe, ce qui était attendu et comment reproduire.",
        },
        {
          text: "Hypothèses testables",
          detail: "Lister les causes probables avant de modifier le code.",
        },
        {
          text: "Correction prouvée",
          detail: "Valider avec un test, un cas manuel ou une comparaison avant/après.",
        },
      ],
      illustration: "debug",
      notes: "Rappel : éviter la logique du patch aléatoire.",
    }),
    s({
      id: "stub-m6",
      layout: "content",
      palette: "slate",
      title: "Module 6 · Git Flow",
      subtitle: "Travailler proprement en équipe.",
      bullets: [
        {
          text: "Branches ciblées",
          detail: "Une branche doit correspondre à une fonctionnalité ou une correction.",
        },
        {
          text: "Commits atomiques",
          detail: "Chaque commit représente une avancée lisible et réversible.",
        },
        {
          text: "Review efficace",
          detail: "Relire le code, les impacts et les risques avant intégration.",
        },
      ],
      illustration: "git-flow",
      notes: "Rappel : l’équipe gagne du temps quand l’historique est propre.",
    }),
    s({
      id: "stub-m7",
      layout: "content",
      palette: "coral",
      title: "Module 7 · Sécurité",
      subtitle: "Protéger le projet dès le prototype.",
      bullets: [
        {
          text: "Secrets protégés",
          detail: "Ne jamais exposer clés, tokens ou accès sensibles dans le dépôt.",
        },
        {
          text: "Entrées validées",
          detail: "Contrôler les données utilisateur avant traitement ou stockage.",
        },
        {
          text: "Permissions limitées",
          detail: "Donner le minimum d’accès nécessaire aux services et comptes.",
        },
      ],
      illustration: "security",
      notes: "Rappel : présenter la sécurité comme une habitude, pas une finition.",
    }),
    s({
      id: "stub-m8",
      layout: "content",
      palette: "forest",
      title: "Module 8 · Projet final",
      subtitle: "Assembler, stabiliser, présenter.",
      bullets: [
        {
          text: "Démo centrée utilisateur",
          detail: "Montrer le parcours qui résout le problème principal.",
        },
        {
          text: "Code stabilisé",
          detail: "Nettoyer les parties critiques et corriger les bugs visibles.",
        },
        {
          text: "Pitch technique",
          detail: "Expliquer les choix, les limites et les prochaines étapes.",
        },
      ],
      illustration: "project",
      notes: "Rappel : relier le projet final à la valeur démontrable.",
    }),
    s({
      id: "stub-eval",
      layout: "content",
      palette: "mint",
      title: "Évaluation",
      subtitle: "Ce qui comptera dans votre progression.",
      bullets: [
        {
          text: "Livrable fonctionnel",
          detail: "Le prototype doit permettre de tester le parcours principal.",
        },
        {
          text: "Qualité du dépôt",
          detail: "README clair, commits lisibles et structure compréhensible.",
        },
        {
          text: "Usage responsable de l’IA",
          detail: "Les choix générés sont relus, adaptés et expliqués.",
        },
      ],
      illustration: "eval",
      notes: "Rappel : l’évaluation porte sur le résultat et la maîtrise du processus.",
    }),
    s({
      id: "closing",
      layout: "closing",
      palette: "mint",
      title: "Prêts pour la boucle",
      subtitle: "Prompt, code, review, test, commit.",
      body: [
        "Votre avantage ne vient pas seulement de l’IA. Il vient de votre capacité à la guider et à livrer proprement.",
      ],
      bullets: [
        {
          text: "Cadrer l’intention",
          detail: "Écrivez le résultat utilisateur avant d’ouvrir le chat IA.",
        },
        {
          text: "Garder le contrôle",
          detail: "Relisez, testez, refusez ce qui est fragile ou opaque.",
        },
        {
          text: "Livrer une preuve",
          detail: "Repo + README + commit lisible : ce que le jury regarde.",
        },
      ],
      illustration: "vibe-loop",
      ctas: [
        {
          label: "Mon espace",
          href: "/hackathon/espace",
        },
      ],
      notes: "Rappel : terminer sur l’action immédiate attendue des participants.",
    }),
  ],
};
