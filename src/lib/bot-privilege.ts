import type { BotBillingMode, BotPlanId } from "@/lib/bot-config";
import { isSuperAdminUserId } from "@/lib/bot-super-admin";
import {
  getActiveBotSubscription,
  listActiveBotSubscriptions,
  type BotSubscriptionRow,
} from "@/lib/bot-subscription-service";

export { isSuperAdminUserId };

function privilegedSubscription(planId: BotPlanId): BotSubscriptionRow {
  const far = new Date("2099-12-31T23:59:59.000Z");
  const now = new Date();
  return {
    id: "privileged",
    planId,
    billing: "demo",
    pricePaid: "0",
    status: "active",
    startsAt: now.toISOString(),
    expiresAt: far.toISOString(),
  };
}

/** Active paid sub, or unlimited access for super-admin. */
export async function resolveBotSubscription(
  userId: string,
  planId: BotPlanId,
): Promise<BotSubscriptionRow | null> {
  const sub = await getActiveBotSubscription(userId, planId);
  if (sub) return sub;
  if (await isSuperAdminUserId(userId)) {
    return privilegedSubscription(planId);
  }
  return null;
}

export async function botAccessAllows(
  userId: string,
  planId: BotPlanId,
  billing: BotBillingMode,
): Promise<boolean> {
  if (await isSuperAdminUserId(userId)) return true;
  const sub = await getActiveBotSubscription(userId, planId);
  return Boolean(sub && sub.billing === billing);
}

export async function userHasAnyBotSubscriptionForBilling(
  userId: string,
  billing: BotBillingMode,
): Promise<boolean> {
  if (await isSuperAdminUserId(userId)) return true;
  const subs = await listActiveBotSubscriptions(userId);
  return subs.some((s) => s.billing === billing);
}
