import { count, eq } from "drizzle-orm";
import {
  communityBlogPosts,
  communityPosts,
  communityQuestions,
} from "@/db/schema";
import { getDb } from "@/db";
import { communityEnabled } from "@/lib/community/config";

export type CommunityModuleCard = {
  id: "feed" | "blogs" | "formations" | "questions";
  href: string;
  titleFr: string;
  titleEn: string;
  subtitleFr: string;
  subtitleEn: string;
  count: number | null;
  available: boolean;
};

export async function getCommunityOverview(): Promise<{
  enabled: boolean;
  modules: CommunityModuleCard[];
}> {
  if (!communityEnabled()) {
    return { enabled: false, modules: [] };
  }

  const db = getDb();
  let postCount = 0;
  let blogCount = 0;
  let questionCount = 0;

  try {
    const [posts] = await db
      .select({ n: count() })
      .from(communityPosts)
      .where(eq(communityPosts.status, "published"));
    postCount = Number(posts?.n ?? 0);

    const [blogs] = await db
      .select({ n: count() })
      .from(communityBlogPosts)
      .where(eq(communityBlogPosts.status, "published"));
    blogCount = Number(blogs?.n ?? 0);

    const [questions] = await db
      .select({ n: count() })
      .from(communityQuestions)
      .where(eq(communityQuestions.status, "open"));
    questionCount = Number(questions?.n ?? 0);
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code !== "42P01") throw e;
  }

  return {
    enabled: true,
    modules: [
      {
        id: "feed",
        href: "/app/community/feed",
        titleFr: "Fil d'actualité",
        titleEn: "News feed",
        subtitleFr: "Publier, commenter, partager",
        subtitleEn: "Post, comment, share",
        count: postCount,
        available: true,
      },
      {
        id: "blogs",
        href: "/app/community/blogs",
        titleFr: "Blogs",
        titleEn: "Blogs",
        subtitleFr: "Articles crypto & finance",
        subtitleEn: "Crypto & finance articles",
        count: blogCount,
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
        count: questionCount,
        available: true,
      },
    ],
  };
}
