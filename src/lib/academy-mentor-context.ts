import type { AssistantLocale } from "@/lib/assistant/messages";
import type {
  AcademyJourneyLevelKey,
  AcademyJourneyNextKind,
  AcademyJourneySnapshot,
} from "@/lib/academy-journey";

export type MentorTone = "beginner" | "intermediate" | "advanced";

/** Per-edition facts injected into the tutor prompt (P3). */
export type AcademyMentorLearnerContext = {
  editionSlug: string;
  programSlug: string;
  programLevel: string;
  priceUsdt: string | null;
  modulesCompleted: number;
  modulesTotal: number;
  pendingModuleTitles: string[];
  nextKind: AcademyJourneyNextKind;
  nextModuleSlug: string | null;
};

export function mentorToneFromLevel(levelKey: AcademyJourneyLevelKey): MentorTone {
  if (levelKey === "explorer" || levelKey === "crypto_user") return "beginner";
  if (levelKey === "ecosystem" || levelKey === "trading") return "intermediate";
  return "advanced";
}

const LEVEL_LABEL_FR: Record<AcademyJourneyLevelKey, string> = {
  explorer: "Explorer Crypto (débutant)",
  crypto_user: "Utilisateur Crypto",
  ecosystem: "Écosystème McBuleli",
  trading: "Bases Trading",
  bots: "Bot Trading",
  advanced: "Crypto Avancé",
};

const LEVEL_LABEL_EN: Record<AcademyJourneyLevelKey, string> = {
  explorer: "Explorer Crypto (beginner)",
  crypto_user: "Crypto User",
  ecosystem: "McBuleli Ecosystem",
  trading: "Trading Foundations",
  bots: "Bot Trading",
  advanced: "Advanced Crypto",
};

function nextStepHintFr(kind: AcademyJourneyNextKind): string {
  const map: Partial<Record<AcademyJourneyNextKind, string>> = {
    live_session: "prochaine étape suggérée : rejoindre un live",
    module: "prochaine étape : micro-leçon",
    quiz: "prochaine étape : quiz fondamentaux",
    enroll_pro: "prochaine étape : rejoindre la cohorte Pro (49 USDT)",
    enter_cohort: "prochaine étape : ouvrir la cohorte",
  };
  return map[kind] ?? "";
}

function nextStepHintEn(kind: AcademyJourneyNextKind): string {
  const map: Partial<Record<AcademyJourneyNextKind, string>> = {
    live_session: "suggested next step: join a live session",
    module: "next step: micro-lesson",
    quiz: "next step: fundamentals quiz",
    enroll_pro: "next step: join Pro cohort (49 USDT)",
    enter_cohort: "next step: open your cohort",
  };
  return map[kind] ?? "";
}

export function buildAcademyMentorSystemAddon(args: {
  locale: AssistantLocale;
  editionTitle: string;
  journey: AcademyJourneySnapshot;
  recentVerbs: string[];
  learner?: AcademyMentorLearnerContext;
}): string {
  const tone = mentorToneFromLevel(args.journey.levelKey);
  const levelLabel =
    args.locale === "fr"
      ? LEVEL_LABEL_FR[args.journey.levelKey]
      : LEVEL_LABEL_EN[args.journey.levelKey];

  const toneGuide =
    args.locale === "fr"
      ? tone === "beginner"
        ? "Ton : très simple, analogies, pas de jargon sans définition, phrases courtes."
        : tone === "intermediate"
          ? "Ton : pratique, liens avec wallet McBuleli et P2P, exemples concrets."
          : "Ton : plus technique si utile, reste concis."
      : tone === "beginner"
        ? "Tone: very simple, analogies, define jargon, short sentences."
        : tone === "intermediate"
          ? "Tone: practical, tie to McBuleli wallet and P2P, concrete examples."
          : "Tone: more technical when helpful, stay concise.";

  const statsLine =
    args.locale === "fr"
      ? `Progression globale : ${args.journey.progressPercent}% · ${args.journey.stats.livesAttended} live(s) · ${args.journey.stats.quizzesPassed} quiz · ${args.journey.stats.badges} badge(s) · ${args.journey.stats.modulesCompleted}/${args.journey.stats.modulesTotal} modules.`
      : `Overall progress: ${args.journey.progressPercent}% · ${args.journey.stats.livesAttended} live(s) · ${args.journey.stats.quizzesPassed} quizzes · ${args.journey.stats.badges} badges · ${args.journey.stats.modulesCompleted}/${args.journey.stats.modulesTotal} modules.`;

  const learner = args.learner;
  const cohortLine =
    learner && learner.modulesTotal > 0
      ? args.locale === "fr"
        ? `Cohorte actuelle (${learner.programSlug}, niveau ${learner.programLevel}) : ${learner.modulesCompleted}/${learner.modulesTotal} micro-leçons terminées.`
        : `Current cohort (${learner.programSlug}, level ${learner.programLevel}): ${learner.modulesCompleted}/${learner.modulesTotal} micro-lessons done.`
      : learner
        ? args.locale === "fr"
          ? `Programme cohorte : ${learner.programSlug} (niveau ${learner.programLevel})${learner.priceUsdt ? ` · ${learner.priceUsdt} USDT` : " · gratuit"}.`
          : `Cohort program: ${learner.programSlug} (${learner.programLevel})${learner.priceUsdt ? ` · ${learner.priceUsdt} USDT` : " · free"}.`
        : "";

  const pendingLine =
    learner && learner.pendingModuleTitles.length > 0
      ? args.locale === "fr"
        ? `Leçons à faire : ${learner.pendingModuleTitles.join(" · ")}.`
        : `Lessons to do: ${learner.pendingModuleTitles.join(" · ")}.`
      : "";

  const nextLine = learner
    ? args.locale === "fr"
      ? nextStepHintFr(learner.nextKind) +
        (learner.nextModuleSlug ? ` (module ${learner.nextModuleSlug})` : "")
      : nextStepHintEn(learner.nextKind) +
        (learner.nextModuleSlug ? ` (module ${learner.nextModuleSlug})` : "")
    : "";

  const historyLine =
    args.recentVerbs.length > 0
      ? args.locale === "fr"
        ? `Activité récente : ${args.recentVerbs.join(", ")}.`
        : `Recent activity: ${args.recentVerbs.join(", ")}.`
      : "";

  const formatRules =
    args.locale === "fr"
      ? `Mise en forme : paragraphes courts, listes, **gras** pour mots-clés, pas de #. Liens : /app/academy, /app/wallet, /app/p2p.`
      : `Formatting: short paragraphs, lists, **bold** keywords, no #. Links: /app/academy, /app/wallet, /app/p2p.`;

  if (args.locale === "fr") {
    return [
      `Tu es le mentor crypto McBuleli Academy — cohorte « ${args.editionTitle} ».`,
      `Niveau détecté : ${levelLabel}. ${toneGuide}`,
      statsLine,
      cohortLine,
      pendingLine,
      nextLine,
      historyLine,
      `Réponds uniquement sur le syllabus (crypto, wallet McBuleli, P2P, trading, IA, Buleli Points). Pas de conseil d'investissement personnalisé. Propose la prochaine micro-leçon ou le live si pertinent.`,
      formatRules,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    `You are the McBuleli Academy crypto mentor — cohort « ${args.editionTitle} ».`,
    `Detected level: ${levelLabel}. ${toneGuide}`,
    statsLine,
    cohortLine,
    pendingLine,
    nextLine,
    historyLine,
    `Answer only on the syllabus (crypto, McBuleli wallet, P2P, trading, AI, Buleli Points). No personalized investment advice. Suggest the next micro-lesson or live when relevant.`,
    formatRules,
  ]
    .filter(Boolean)
    .join(" ");
}
