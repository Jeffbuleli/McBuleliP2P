import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { communityUserProfiles, getDb } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { ensureCommunityProfile } from "@/lib/community/profile-service";
import {
  mergeCommunityProfileMeta,
  parseCommunityProfileMeta,
} from "@/lib/community/profile-meta";

const bodyZ = z.object({
  showBotLeaderboard: z.boolean().optional(),
  copyTradingEnabled: z.boolean().optional(),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureCommunityProfile(userId);
  const db = getDb();
  const [row] = await db
    .select({ meta: communityUserProfiles.meta })
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.userId, userId))
    .limit(1);
  return NextResponse.json({ meta: parseCommunityProfileMeta(row?.meta) });
}

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  await ensureCommunityProfile(userId);
  const db = getDb();
  const [row] = await db
    .select({ meta: communityUserProfiles.meta })
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.userId, userId))
    .limit(1);

  const next = mergeCommunityProfileMeta(row?.meta, {
    ...(parsed.data.showBotLeaderboard !== undefined
      ? { showBotLeaderboard: parsed.data.showBotLeaderboard }
      : {}),
    ...(parsed.data.copyTradingEnabled !== undefined
      ? { copyTradingEnabled: parsed.data.copyTradingEnabled }
      : {}),
  });

  await db
    .update(communityUserProfiles)
    .set({ meta: next, updatedAt: new Date() })
    .where(eq(communityUserProfiles.userId, userId));

  return NextResponse.json({ ok: true, meta: next });
}
