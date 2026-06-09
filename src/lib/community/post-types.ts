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
    color: "#305f33",
    bg: "#e8f3ee",
  },
  discussion: {
    id: "discussion",
    labelFr: "Discussion",
    labelEn: "Discussion",
    color: "#1d4ed8",
    bg: "#eff6ff",
  },
  question: {
    id: "question",
    labelFr: "Question",
    labelEn: "Question",
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
  analysis: {
    id: "analysis",
    labelFr: "Analyse",
    labelEn: "Analysis",
    color: "#0f766e",
    bg: "#f0fdfa",
  },
  signal: {
    id: "signal",
    labelFr: "Signal",
    labelEn: "Signal",
    color: "#b45309",
    bg: "#fffbeb",
  },
  article: {
    id: "article",
    labelFr: "Article",
    labelEn: "Article",
    color: "#305f33",
    bg: "#e8f3ee",
  },
  experience: {
    id: "experience",
    labelFr: "Expérience",
    labelEn: "Experience",
    color: "#be185d",
    bg: "#fdf2f8",
  },
  formation: {
    id: "formation",
    labelFr: "Formation",
    labelEn: "Training",
    color: "#305f33",
    bg: "#e8f3ee",
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
