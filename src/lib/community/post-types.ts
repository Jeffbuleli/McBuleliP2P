import type { ReputationLevelId } from "@/lib/community/reputation-levels";

export type CommunityContentKind =
  | "news"
  | "discussion"
  | "question"
  | "analysis"
  | "signal"
  | "article"
  | "experience"
  | "formation";

export type PostTypeConfig = {
  id: CommunityContentKind;
  labelFr: string;
  labelEn: string;
  color: string;
  bg: string;
};

export const POST_TYPE_CONFIG: Record<CommunityContentKind, PostTypeConfig> = {
  news: {
    id: "news",
    labelFr: "Actualité",
    labelEn: "News",
    color: "#6ee7b7",
    bg: "rgba(52,211,153,0.12)",
  },
  discussion: {
    id: "discussion",
    labelFr: "Discussion",
    labelEn: "Discussion",
    color: "#67e8f9",
    bg: "rgba(34,211,238,0.12)",
  },
  question: {
    id: "question",
    labelFr: "Question",
    labelEn: "Question",
    color: "#c4b5fd",
    bg: "rgba(192,132,252,0.12)",
  },
  analysis: {
    id: "analysis",
    labelFr: "Analyse",
    labelEn: "Analysis",
    color: "#5eead4",
    bg: "rgba(45,212,191,0.12)",
  },
  signal: {
    id: "signal",
    labelFr: "Signal",
    labelEn: "Signal",
    color: "#fcd34d",
    bg: "rgba(251,191,36,0.12)",
  },
  article: {
    id: "article",
    labelFr: "Article",
    labelEn: "Article",
    color: "#6ee7b7",
    bg: "rgba(52,211,153,0.12)",
  },
  experience: {
    id: "experience",
    labelFr: "Expérience",
    labelEn: "Experience",
    color: "#f9a8d4",
    bg: "rgba(244,114,182,0.12)",
  },
  formation: {
    id: "formation",
    labelFr: "Formation",
    labelEn: "Training",
    color: "#6ee7b7",
    bg: "rgba(52,211,153,0.12)",
  },
};

export function postTypeConfig(kind: CommunityContentKind): PostTypeConfig {
  return POST_TYPE_CONFIG[kind];
}

/** Map badge slug → reputation tier for display */
export const BADGE_TO_LEVEL: Partial<Record<string, ReputationLevelId>> = {
  contributor: "contributor",
  signal_pro: "expert",
  top_trader: "expert",
  mentor: "trainer",
};
