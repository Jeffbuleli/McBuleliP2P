export type CommunityModuleCard = {
  id: "feed" | "blogs" | "formations" | "questions" | "signals" | "traders";
  href: string;
  titleFr: string;
  titleEn: string;
  subtitleFr: string;
  subtitleEn: string;
  count: number | null;
  available: boolean;
};

/** Liste statique - affichée même si l'API overview échoue ou tables absentes. */
export function getDefaultCommunityModules(): CommunityModuleCard[] {
  return [
    {
      id: "feed",
      href: "/app/community/feed",
      titleFr: "Fil d'actualité",
      titleEn: "News feed",
      subtitleFr: "Publier, commenter, partager",
      subtitleEn: "Post, comment, share",
      count: null,
      available: true,
    },
    {
      id: "blogs",
      href: "/app/community/blogs",
      titleFr: "Blogs",
      titleEn: "Blogs",
      subtitleFr: "Articles crypto & finance",
      subtitleEn: "Crypto & finance articles",
      count: null,
      available: true,
    },
    {
      id: "formations",
      href: "/app/community/formations",
      titleFr: "Formations",
      titleEn: "Training",
      subtitleFr: "Lives Jitsi & replays",
      subtitleEn: "Jitsi lives & replays",
      count: null,
      available: true,
    },
    {
      id: "questions",
      href: "/app/community/questions",
      titleFr: "Questions",
      titleEn: "Q&A",
      subtitleFr: "Poser une question, voter",
      subtitleEn: "Ask, answer, vote",
      count: null,
      available: true,
    },
    {
      id: "signals",
      href: "/app/community/signals",
      titleFr: "Signaux trading",
      titleEn: "Trading signals",
      subtitleFr: "Idées éducatives, clôture manuelle",
      subtitleEn: "Educational ideas, manual close",
      count: null,
      available: true,
    },
    {
      id: "traders",
      href: "/app/community/traders",
      titleFr: "Classement traders",
      titleEn: "Trader leaderboard",
      subtitleFr: "Réputation, démo, copy trading bientôt",
      subtitleEn: "Reputation, demo, copy trading soon",
      count: null,
      available: true,
    },
  ];
}

export function mergeModuleCounts(
  modules: CommunityModuleCard[],
  counts: Partial<Record<CommunityModuleCard["id"], number | null>>,
): CommunityModuleCard[] {
  return modules.map((m) => ({
    ...m,
    count: counts[m.id] !== undefined ? counts[m.id]! : m.count,
  }));
}
