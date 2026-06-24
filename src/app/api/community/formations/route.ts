import { NextResponse } from "next/server";
import { getAcademyHub, listCommunityReplays, listCommunityUpcomingEvents } from "@/lib/academy-service";
import { communityEnabled } from "@/lib/community/config";
import { listFormationPosts } from "@/lib/community/feed-service";
import { getLocale } from "@/lib/get-locale";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!communityEnabled()) {
    return NextResponse.json({ sessions: [], editions: [], formationPosts: [] });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const locale = await getLocale();
    const [hub, formations, upcomingEvents, replays] = await Promise.all([
      getAcademyHub({
        userId: user.id,
        locale,
        viewerRole:
          user.role === "agent" || user.role === "super_admin" ? "staff" : "learner",
      }),
      listFormationPosts({ viewerId: user.id, limit: 12 }),
      listCommunityUpcomingEvents({ userId: user.id, locale }),
      listCommunityReplays({ userId: user.id, locale }),
    ]);

    return NextResponse.json({
      upcomingSessions: hub.upcomingSessions,
      upcomingEvents,
      replays,
      programs: hub.programs.map((p) => ({
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        level: p.level,
        priceUsdt: p.priceUsdt,
        requiresKyc: p.requiresKyc,
      })),
      editions: hub.editions.map((e) => ({
        slug: e.slug,
        title: e.title,
        startsAt: e.startsAt,
        enrolled: e.enrolled,
        programSlug: e.programSlug,
        priceUsdt: e.priceUsdt,
        requiresKyc: e.requiresKyc,
      })),
      formationPosts: formations.posts.map((p) => ({
        id: p.id,
        body: p.body,
        publishedAt: p.publishedAt,
        formationMeta: p.formationMeta,
        author: p.author,
        likeCount: p.likeCount,
        commentCount: p.commentCount,
      })),
    });
  } catch {
    return NextResponse.json({
      upcomingSessions: [],
      upcomingEvents: [],
      replays: [],
      programs: [],
      editions: [],
      formationPosts: [],
    });
  }
}
