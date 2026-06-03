import type { AssistantLocale } from "@/lib/assistant/messages";
import type { AcademyJourneyLevelKey, AcademyJourneySnapshot } from "@/lib/academy-journey";

export type MentorTone = "beginner" | "intermediate" | "advanced";

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

export function buildAcademyMentorSystemAddon(args: {
  locale: AssistantLocale;
  editionTitle: string;
  journey: AcademyJourneySnapshot;
  recentVerbs: string[];
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
      ? `Progression apprenant : ${args.journey.progressPercent}% · ${args.journey.stats.livesAttended} live(s) · ${args.journey.stats.quizzesPassed} quiz validé(s) · ${args.journey.stats.badges} badge(s).`
      : `Learner progress: ${args.journey.progressPercent}% · ${args.journey.stats.livesAttended} live(s) · ${args.journey.stats.quizzesPassed} quiz passed · ${args.journey.stats.badges} badge(s).`;

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
      historyLine,
      `Réponds uniquement sur le syllabus (crypto, wallet McBuleli, P2P, trading, IA, Buleli Points). Pas de conseil d'investissement personnalisé. Encourage live + quiz si pertinent.`,
      formatRules,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    `You are the McBuleli Academy crypto mentor — cohort « ${args.editionTitle} ».`,
    `Detected level: ${levelLabel}. ${toneGuide}`,
    statsLine,
    historyLine,
    `Answer only on the syllabus (crypto, McBuleli wallet, P2P, trading, AI, Buleli Points). No personalized investment advice. Encourage live + quiz when relevant.`,
    formatRules,
  ]
    .filter(Boolean)
    .join(" ");
}
