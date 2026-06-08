import { count, eq } from "drizzle-orm";
import {
  communityBlogPosts,
  communityPosts,
  communityQuestions,
  communityTradingSignals,
} from "@/db/schema";
import { getDb } from "@/db";
import { communityEnabled } from "@/lib/community/config";
import {
  getDefaultCommunityModules,
  mergeModuleCounts,
  type CommunityModuleCard,
} from "@/lib/community/default-modules";

export type { CommunityModuleCard };

async function safeCount(
  run: () => Promise<number>,
): Promise<number | null> {
  try {
    return await run();
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === "42P01") return null;
    return null;
  }
}

export async function getCommunityOverview(): Promise<{
  enabled: boolean;
  modules: CommunityModuleCard[];
}> {
  const modules = getDefaultCommunityModules();
  const flagOn = communityEnabled();

  if (!flagOn) {
    return { enabled: false, modules };
  }

  let postCount: number | null = null;
  let blogCount: number | null = null;
  let questionCount: number | null = null;
  let signalCount: number | null = null;

  try {
    const db = getDb();

    postCount = await safeCount(async () => {
      const [row] = await db
        .select({ n: count() })
        .from(communityPosts)
        .where(eq(communityPosts.status, "published"));
      return Number(row?.n ?? 0);
    });

    blogCount = await safeCount(async () => {
      const [row] = await db
        .select({ n: count() })
        .from(communityBlogPosts)
        .where(eq(communityBlogPosts.status, "published"));
      return Number(row?.n ?? 0);
    });

    questionCount = await safeCount(async () => {
      const [row] = await db
        .select({ n: count() })
        .from(communityQuestions)
        .where(eq(communityQuestions.status, "open"));
      return Number(row?.n ?? 0);
    });

    signalCount = await safeCount(async () => {
      const [row] = await db
        .select({ n: count() })
        .from(communityTradingSignals)
        .where(eq(communityTradingSignals.status, "open"));
      return Number(row?.n ?? 0);
    });
  } catch {
    /* garde les modules par défaut */
  }

  return {
    enabled: true,
    modules: mergeModuleCounts(modules, {
      feed: postCount,
      blogs: blogCount,
      questions: questionCount,
      signals: signalCount,
    }),
  };
}
