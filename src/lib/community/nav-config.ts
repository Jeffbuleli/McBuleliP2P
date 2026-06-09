export type CommunityPrimaryId = "news" | "discussions" | "training";
export type CommunityExploreId = "blogs" | "questions" | "signals" | "ranking";

/** Menu filtre du fil communauté (page /app/community). */
export type CommunityCategoryId =
  | "all"
  | "trending"
  | "news"
  | "discussions"
  | "training"
  | "blogs"
  | "questions"
  | "signals"
  | "ranking";

export type CommunityCategoryNavItem = {
  id: CommunityCategoryId;
  labelFr: string;
  labelEn: string;
  href?: string;
};

export const COMMUNITY_CATEGORY_NAV: CommunityCategoryNavItem[] = [
  { id: "all", labelFr: "Tout", labelEn: "All" },
  { id: "trending", labelFr: "Tendances", labelEn: "Trending" },
  { id: "news", labelFr: "Actualités", labelEn: "News" },
  { id: "discussions", labelFr: "Discussions", labelEn: "Discussions" },
  { id: "training", labelFr: "Formations", labelEn: "Training", href: "/app/community/formations" },
  { id: "blogs", labelFr: "Blogs", labelEn: "Blogs" },
  { id: "questions", labelFr: "Questions", labelEn: "Q&A" },
  { id: "signals", labelFr: "Signaux", labelEn: "Signals" },
  { id: "ranking", labelFr: "Classement", labelEn: "Ranking", href: "/app/community/traders" },
];

export type CommunityPrimaryNavItem = {
  id: CommunityPrimaryId;
  href: string;
  titleFr: string;
  titleEn: string;
  subtitleFr: string;
  subtitleEn: string;
};

export type CommunityExploreNavItem = {
  id: CommunityExploreId;
  href: string;
  titleFr: string;
  titleEn: string;
  subtitleFr: string;
  subtitleEn: string;
};

export const COMMUNITY_PRIMARY: CommunityPrimaryNavItem[] = [
  {
    id: "news",
    href: "/app/community/feed",
    titleFr: "Actualités",
    titleEn: "News",
    subtitleFr: "Publications récentes",
    subtitleEn: "Recent posts",
  },
  {
    id: "discussions",
    href: "/app/community/discussions",
    titleFr: "Discussions",
    titleEn: "Discussions",
    subtitleFr: "Échanger avec les membres",
    subtitleEn: "Talk with members",
  },
  {
    id: "training",
    href: "/app/community/formations",
    titleFr: "Formations",
    titleEn: "Training",
    subtitleFr: "Lives et replays",
    subtitleEn: "Lives & replays",
  },
];

export const COMMUNITY_EXPLORE: CommunityExploreNavItem[] = [
  {
    id: "blogs",
    href: "/app/community/blogs",
    titleFr: "Blogs",
    titleEn: "Blogs",
    subtitleFr: "Articles et analyses",
    subtitleEn: "Articles & analysis",
  },
  {
    id: "questions",
    href: "/app/community/questions",
    titleFr: "Questions",
    titleEn: "Q&A",
    subtitleFr: "Aide et réponses",
    subtitleEn: "Help & answers",
  },
  {
    id: "signals",
    href: "/app/community/signals",
    titleFr: "Signaux Trading",
    titleEn: "Trading signals",
    subtitleFr: "Contenu éducatif",
    subtitleEn: "Educational content",
  },
  {
    id: "ranking",
    href: "/app/community/traders",
    titleFr: "Classement",
    titleEn: "Leaderboard",
    subtitleFr: "Contributeurs actifs",
    subtitleEn: "Top contributors",
  },
];
