import { NextResponse } from "next/server";
import {
  getAcademyHub,
  listCommunityProgramCatalog,
  listCommunityReplays,
  listCommunityUpcomingEvents,
  listCommunityUpcomingSessions,
} from "@/lib/academy-service";
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
    const [hub, formations, upcomingEvents, replays, catalogEditions, upcomingSessions] =
      await Promise.all([
      getAcademyHub({
        userId: user.id,
        locale,
        viewerRole:
          user.role === "agent" || user.role === "super_admin" ? "staff" : "learner",
      }),
      listFormationPosts({ viewerId: user.id, limit: 12 }),
      listCommunityUpcomingEvents({ userId: user.id, locale }),
      listCommunityReplays({ userId: user.id, locale }),
      listCommunityProgramCatalog({ userId: user.id, locale }),
      listCommunityUpcomingSessions({
        userId: user.id,
        locale,
        viewerRole:
          user.role === "agent" || user.role === "super_admin" ? "staff" : "learner",
      }),
    ]);

    return NextResponse.json({
      upcomingSessions,
      upcomingEvents,
      replays,
      catalogEditions: catalogEditions.map((e) => ({
        slug: e.slug,
        title: e.title,
        programSlug: e.programSlug,
        programTitle: e.programTitle,
        status: e.status,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        enrolled: e.enrolled,
        priceUsdt: e.priceUsdt,
        requiresKyc: e.requiresKyc,
      })),
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
      catalogEditions: [],
      programs: [],
      editions: [],
      formationPosts: [],
    });
  }
}
