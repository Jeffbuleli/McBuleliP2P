import { and, eq, sql } from "drizzle-orm";
import {
  botCopyFollows,
  botInstances,
  communityUserProfiles,
  getDb,
} from "@/db";
import type { BotBillingMode, BotPlanId } from "@/lib/bot-config";
import { mergeLeadConfigForCopy } from "@/lib/bot-copy-config";
import {
  upsertBotInstance,
  validateInstanceConfig,
} from "@/lib/bot-instance-service";
import { botAccessAllows } from "@/lib/bot-privilege";
import { notifyCommunityBotCopyStarted } from "@/lib/community/community-notifications";
import { parseCommunityProfileMeta } from "@/lib/community/profile-meta";
import { checkKycGate } from "@/lib/kyc-guard";
import { grantBotCopyLeadReward } from "@/lib/community/rewards-service";

export type BotCopyFollowView = {
  id: string;
  leadUserId: string;
  leadInstanceId: string;
  planId: BotPlanId;
  billing: BotBillingMode;
  sizingRatio: number;
  status: "active" | "paused";
  leadHandle: string | null;
  leadDisplayName: string | null;
  createdAt: string;
};

export type BotCopyTickOverlay = {
  config: Record<string, unknown>;
  signalInstanceId: string;
  readOnlySignal: boolean;
  leadUserId: string;
};

export async function getActiveBotCopyFollow(args: {
  followerId: string;
  planId: BotPlanId;
  billing: BotBillingMode;
}): Promise<BotCopyFollowView | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: botCopyFollows.id,
      leadUserId: botCopyFollows.leadUserId,
      leadInstanceId: botCopyFollows.leadInstanceId,
      planId: botCopyFollows.planId,
      billing: botCopyFollows.billing,
      sizingRatio: botCopyFollows.sizingRatio,
      status: botCopyFollows.status,
      createdAt: botCopyFollows.createdAt,
      handle: communityUserProfiles.handle,
      displayName: communityUserProfiles.displayName,
    })
    .from(botCopyFollows)
    .leftJoin(
      communityUserProfiles,
      eq(communityUserProfiles.userId, botCopyFollows.leadUserId),
    )
    .where(
      and(
        eq(botCopyFollows.followerId, args.followerId),
        eq(botCopyFollows.planId, args.planId),
        eq(botCopyFollows.billing, args.billing),
        eq(botCopyFollows.status, "active"),
      ),
    )
    .limit(1);

  if (!row) return null;
  return {
    id: row.id,
    leadUserId: row.leadUserId,
    leadInstanceId: row.leadInstanceId,
    planId: row.planId as BotPlanId,
    billing: row.billing as BotBillingMode,
    sizingRatio: Number(row.sizingRatio),
    status: row.status as "active" | "paused",
    leadHandle: row.handle,
    leadDisplayName: row.displayName,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function isCopyingLead(
  followerId: string | null,
  leadUserId: string,
  planId: BotPlanId,
  billing: BotBillingMode,
): Promise<boolean> {
  if (!followerId) return false;
  const db = getDb();
  const [row] = await db
    .select({ id: botCopyFollows.id })
    .from(botCopyFollows)
    .where(
      and(
        eq(botCopyFollows.followerId, followerId),
        eq(botCopyFollows.leadUserId, leadUserId),
        eq(botCopyFollows.planId, planId),
        eq(botCopyFollows.billing, billing),
        eq(botCopyFollows.status, "active"),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function countLeadCopyFollowers(leadUserId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(botCopyFollows)
    .where(
      and(
        eq(botCopyFollows.leadUserId, leadUserId),
        eq(botCopyFollows.status, "active"),
      ),
    );
  return row?.n ?? 0;
}

export async function resolveBotCopyTickOverlay(args: {
  followerId: string;
  followerInstanceId: string;
  planId: BotPlanId;
  billing: BotBillingMode;
  config: Record<string, unknown>;
}): Promise<BotCopyTickOverlay | null> {
  const follow = await getActiveBotCopyFollow({
    followerId: args.followerId,
    planId: args.planId,
    billing: args.billing,
  });
  if (!follow) return null;

  const db = getDb();
  const [leadInst] = await db
    .select({ config: botInstances.config, status: botInstances.status })
    .from(botInstances)
    .where(eq(botInstances.id, follow.leadInstanceId))
    .limit(1);
  if (!leadInst || leadInst.status !== "active") return null;

  const merged = mergeLeadConfigForCopy(
    (leadInst.config ?? {}) as Record<string, unknown>,
    args.config,
    follow.sizingRatio,
  );

  return {
    config: merged,
    signalInstanceId: follow.leadInstanceId,
    readOnlySignal: true,
    leadUserId: follow.leadUserId,
  };
}

export async function startBotCopyFollow(args: {
  followerId: string;
  leadUserId: string;
  planId: BotPlanId;
  billing: BotBillingMode;
  sizingRatio?: number;
}): Promise<{ ok: true; follow: BotCopyFollowView } | { ok: false; error: string }> {
  if (args.followerId === args.leadUserId) {
    return { ok: false, error: "bots_copy_self" };
  }

  const ratio = Math.min(1, Math.max(0.1, args.sizingRatio ?? 0.5));

  const allowed = await botAccessAllows(args.followerId, args.planId, args.billing);
  if (!allowed) return { ok: false, error: "bots_subscription_required" };

  if (args.billing === "live") {
    const kycFollower = await checkKycGate(args.followerId, "trade_bots");
    if (!kycFollower.ok) return { ok: false, error: "kyc_required" };
    const kycLead = await checkKycGate(args.leadUserId, "trade_bots");
    if (!kycLead.ok) return { ok: false, error: "bots_copy_lead_kyc" };
  }

  const db = getDb();
  const [leadProfile] = await db
    .select({ meta: communityUserProfiles.meta })
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.userId, args.leadUserId))
    .limit(1);
  const leadMeta = parseCommunityProfileMeta(leadProfile?.meta);
  if (!leadMeta.copyTradingEnabled) {
    return { ok: false, error: "bots_copy_not_enabled" };
  }

  const [leadInst] = await db
    .select()
    .from(botInstances)
    .where(
      and(
        eq(botInstances.userId, args.leadUserId),
        eq(botInstances.planId, args.planId),
        eq(botInstances.billing, args.billing),
        eq(botInstances.status, "active"),
      ),
    )
    .limit(1);
  if (!leadInst) return { ok: false, error: "bots_copy_lead_inactive" };

  const [followerInst] = await db
    .select()
    .from(botInstances)
    .where(
      and(
        eq(botInstances.userId, args.followerId),
        eq(botInstances.planId, args.planId),
      ),
    )
    .limit(1);

  const merged = mergeLeadConfigForCopy(
    (leadInst.config ?? {}) as Record<string, unknown>,
    (followerInst?.config ?? {}) as Record<string, unknown>,
    ratio,
  );
  const valid = validateInstanceConfig(args.planId, merged);
  if (!valid.ok) return { ok: false, error: valid.message };

  const now = new Date();
  const [row] = await db
    .insert(botCopyFollows)
    .values({
      followerId: args.followerId,
      leadUserId: args.leadUserId,
      leadInstanceId: leadInst.id,
      planId: args.planId,
      billing: args.billing,
      sizingRatio: String(ratio),
      status: "active",
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        botCopyFollows.followerId,
        botCopyFollows.leadUserId,
        botCopyFollows.planId,
        botCopyFollows.billing,
      ],
      set: {
        leadInstanceId: leadInst.id,
        sizingRatio: String(ratio),
        status: "active",
        updatedAt: now,
      },
    })
    .returning();

  if (!row) return { ok: false, error: "bots_copy_failed" };

  await upsertBotInstance({
    userId: args.followerId,
    planId: args.planId,
    billing: args.billing,
    status: followerInst?.status === "active" ? "active" : "paused",
    config: merged,
  });

  void notifyCommunityBotCopyStarted({
    leadId: args.leadUserId,
    followerId: args.followerId,
    planId: args.planId,
    billing: args.billing,
  }).catch(() => {});

  void grantBotCopyLeadReward({
    leadUserId: args.leadUserId,
    followerId: args.followerId,
    followId: row.id,
  }).catch(() => {});

  const follow = await getActiveBotCopyFollow({
    followerId: args.followerId,
    planId: args.planId,
    billing: args.billing,
  });
  if (!follow) return { ok: false, error: "bots_copy_failed" };

  return { ok: true, follow };
}

export async function stopBotCopyFollow(args: {
  followerId: string;
  planId: BotPlanId;
  billing: BotBillingMode;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  const now = new Date();
  const res = await db
    .update(botCopyFollows)
    .set({ status: "paused", updatedAt: now })
    .where(
      and(
        eq(botCopyFollows.followerId, args.followerId),
        eq(botCopyFollows.planId, args.planId),
        eq(botCopyFollows.billing, args.billing),
        eq(botCopyFollows.status, "active"),
      ),
    )
    .returning({ id: botCopyFollows.id });

  if (!res.length) return { ok: false, error: "bots_copy_not_active" };
  return { ok: true };
}
