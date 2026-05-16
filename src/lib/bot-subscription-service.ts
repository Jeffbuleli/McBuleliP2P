import { and, desc, eq, gt, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb, botSubscriptions, users } from "@/db";
import {
  BOT_PLANS,
  BOT_SUBSCRIPTION_DAYS,
  type BotBillingMode,
  type BotPlanId,
  isBotPlanId,
  planPriceUsdt,
} from "@/lib/bot-config";
import { debitTradeDemoUsdt } from "@/lib/trade-demo-balance";
import { fmtWalletAmount, numFromNumeric } from "@/lib/wallet-types";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";

export type BotSubscriptionRow = {
  id: string;
  planId: BotPlanId;
  billing: BotBillingMode;
  pricePaid: string;
  status: string;
  startsAt: string;
  expiresAt: string;
};

export async function getActiveBotSubscription(
  userId: string,
  planId: BotPlanId,
): Promise<BotSubscriptionRow | null> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .select()
    .from(botSubscriptions)
    .where(
      and(
        eq(botSubscriptions.userId, userId),
        eq(botSubscriptions.planId, planId),
        eq(botSubscriptions.status, "active"),
        gt(botSubscriptions.expiresAt, now),
      ),
    )
    .orderBy(desc(botSubscriptions.expiresAt))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    planId: row.planId as BotPlanId,
    billing: row.billing as BotBillingMode,
    pricePaid: row.pricePaid.toString(),
    status: row.status,
    startsAt: row.startsAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  };
}

export async function listActiveBotSubscriptions(
  userId: string,
): Promise<BotSubscriptionRow[]> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select()
    .from(botSubscriptions)
    .where(
      and(
        eq(botSubscriptions.userId, userId),
        eq(botSubscriptions.status, "active"),
        gt(botSubscriptions.expiresAt, now),
      ),
    )
    .orderBy(desc(botSubscriptions.expiresAt));
  return rows.map((row) => ({
    id: row.id,
    planId: row.planId as BotPlanId,
    billing: row.billing as BotBillingMode,
    pricePaid: row.pricePaid.toString(),
    status: row.status,
    startsAt: row.startsAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  }));
}

export async function purchaseBotSubscription(args: {
  userId: string;
  planId: BotPlanId;
  billing: BotBillingMode;
}): Promise<
  { ok: true; subscription: BotSubscriptionRow } | { ok: false; message: string }
> {
  if (!isBotPlanId(args.planId)) {
    return { ok: false, message: "bots_invalid_plan" };
  }
  const plan = BOT_PLANS[args.planId];
  const price = planPriceUsdt(args.planId, args.billing);
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, message: "bots_invalid_price" };
  }
  const priceStr = fmtWalletAmount(price);

  const existing = await getActiveBotSubscription(args.userId, args.planId);
  if (existing) {
    return { ok: false, message: "bots_subscription_already_active" };
  }

  const db = getDb();
  const expiresAt = new Date(
    Date.now() + BOT_SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000,
  );

  try {
    const subscription = await db.transaction(async (tx) => {
      if (args.billing === "demo") {
        const [u] = await tx
          .select({ tradeDemoUsdtBalance: users.tradeDemoUsdtBalance })
          .from(users)
          .where(eq(users.id, args.userId))
          .limit(1);
        const bal = numFromNumeric(u?.tradeDemoUsdtBalance?.toString());
        if (bal + 1e-12 < price) {
          throw new Error("bots_insufficient_demo_balance");
        }
        await debitTradeDemoUsdt(tx, args.userId, priceStr);
      } else {
        const [deducted] = await tx
          .update(users)
          .set({
            balance: sql`${users.balance} - ${priceStr}::numeric`,
          })
          .where(
            and(
              eq(users.id, args.userId),
              sql`${users.balance} >= ${priceStr}::numeric`,
            ),
          )
          .returning({ id: users.id });
        if (!deducted) {
          throw new Error("bots_insufficient_balance");
        }
        const batchId = randomUUID();
        await insertWalletLedgerLines(tx, [
          {
            batchId,
            userId: args.userId,
            entryType: "bot_subscription",
            asset: "USDT",
            amount: `-${priceStr}`,
            meta: { planId: args.planId, billing: args.billing },
          },
        ]);
      }

      const [row] = await tx
        .insert(botSubscriptions)
        .values({
          userId: args.userId,
          planId: args.planId,
          billing: args.billing,
          pricePaid: priceStr,
          status: "active",
          expiresAt,
        })
        .returning();

      return {
        id: row.id,
        planId: row.planId as BotPlanId,
        billing: row.billing as BotBillingMode,
        pricePaid: row.pricePaid.toString(),
        status: row.status,
        startsAt: row.startsAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
      };
    });

    return { ok: true, subscription };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "bots_subscribe_failed";
    return { ok: false, message: msg };
  }
}
