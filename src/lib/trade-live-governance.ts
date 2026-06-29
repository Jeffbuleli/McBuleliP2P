import { and, eq, gte, inArray, sql } from "drizzle-orm";
import {
  academyModuleProgress,
  academyModules,
  getDb,
  tradeFuturesPositions,
  tradeLiveEvents,
  users,
} from "@/db";
import { createUserNotification } from "@/lib/notifications-service";
import { getHouseRiskSnapshot, type HouseRiskSnapshot } from "@/lib/trade-house-risk";
import { numFromNumeric } from "@/lib/wallet-types";
import { sendBrandedEmail } from "@/lib/email/send-branded";
import { renderMcBuleliEmail } from "@/lib/email/layout";
import type { EmailLocale } from "@/lib/email/locale";

/** Closed demo futures required before self-serve live enable (unless Academy bypass). */
export const TRADE_LIVE_MIN_DEMO_CLOSED = 3;

/** Per-position margin cap (USDT) - tier 1 vs tier 2 after experienced threshold. */
export const TRADE_LIVE_MARGIN_TIER1_USDT = 500;
export const TRADE_LIVE_MARGIN_TIER2_USDT = 2000;
export const TRADE_LIVE_EXPERIENCED_CLOSED = 10;

export type TradeLiveGovernanceSnapshot = {
  tradeLiveEnabled: boolean;
  tradeLiveDisabledReason: string | null;
  demoClosedTrades: number;
  liveClosedTrades: number;
  minDemoClosedRequired: number;
  graduationEligible: boolean;
  graduationViaAcademy: boolean;
  liveMarginCapUsdt: number;
  liveOpenMarginUsdt: number;
  liveDailyLossUsdt: number;
  liveDailyLossCapUsdt: number;
  custodialProduct: true;
  house: HouseRiskSnapshot;
};

export type TradeLiveEnableError =
  | "trade_live_not_enabled"
  | "trade_live_admin_disabled"
  | "trade_live_graduation_required"
  | "kyc_required"
  | "kyc_country_unsupported"
  | "trade_live_enable_failed";

export function tradeLiveDailyLossCapUsdt(): number {
  const n = Number(process.env.TRADE_MAX_LIVE_DAILY_LOSS_USDT ?? "500");
  return Number.isFinite(n) && n > 0 ? n : 500;
}

async function countClosedFutures(
  userId: string,
  isDemo: boolean,
): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(tradeFuturesPositions)
    .where(
      and(
        eq(tradeFuturesPositions.userId, userId),
        inArray(tradeFuturesPositions.status, ["closed", "liquidated"]),
        eq(tradeFuturesPositions.isDemo, isDemo),
      ),
    );
  return row?.c ?? 0;
}

async function hasAcademyTradingModuleComplete(
  userId: string,
): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: academyModuleProgress.id })
    .from(academyModuleProgress)
    .innerJoin(
      academyModules,
      eq(academyModules.id, academyModuleProgress.moduleId),
    )
    .where(
      and(
        eq(academyModuleProgress.userId, userId),
        eq(academyModules.slug, "trading"),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export function liveMarginCapForClosedTrades(liveClosed: number): number {
  return liveClosed >= TRADE_LIVE_EXPERIENCED_CLOSED
    ? TRADE_LIVE_MARGIN_TIER2_USDT
    : TRADE_LIVE_MARGIN_TIER1_USDT;
}

async function sumLiveOpenMarginUsdt(userId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({
      s: sql<string>`coalesce(sum(${tradeFuturesPositions.marginUsdt}), 0)`,
    })
    .from(tradeFuturesPositions)
    .where(
      and(
        eq(tradeFuturesPositions.userId, userId),
        eq(tradeFuturesPositions.status, "open"),
        eq(tradeFuturesPositions.isDemo, false),
      ),
    );
  return numFromNumeric(row?.s ?? "0");
}

async function sumLiveDailyLossUsdt(userId: string): Promise<number> {
  const db = getDb();
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const [row] = await db
    .select({
      s: sql<string>`coalesce(sum(case when ${tradeFuturesPositions.realizedPnlUsdt}::numeric < 0 then -${tradeFuturesPositions.realizedPnlUsdt}::numeric else 0 end), 0)`,
    })
    .from(tradeFuturesPositions)
    .where(
      and(
        eq(tradeFuturesPositions.userId, userId),
        eq(tradeFuturesPositions.isDemo, false),
        inArray(tradeFuturesPositions.status, ["closed", "liquidated"]),
        gte(tradeFuturesPositions.closedAt, start),
      ),
    );
  return numFromNumeric(row?.s ?? "0");
}

export async function getTradeLiveGovernance(
  userId: string,
): Promise<TradeLiveGovernanceSnapshot | null> {
  const db = getDb();
  const [u] = await db
    .select({
      tradeLiveEnabled: users.tradeLiveEnabled,
      tradeLiveDisabledReason: users.tradeLiveDisabledReason,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return null;

  const [demoClosed, liveClosed, academyBypass, openMargin, dailyLoss, house] =
    await Promise.all([
      countClosedFutures(userId, true),
      countClosedFutures(userId, false),
      hasAcademyTradingModuleComplete(userId),
      sumLiveOpenMarginUsdt(userId),
      sumLiveDailyLossUsdt(userId),
      getHouseRiskSnapshot(),
    ]);

  const graduationEligible =
    demoClosed >= TRADE_LIVE_MIN_DEMO_CLOSED || academyBypass;

  return {
    tradeLiveEnabled: u.tradeLiveEnabled,
    tradeLiveDisabledReason: u.tradeLiveDisabledReason ?? null,
    demoClosedTrades: demoClosed,
    liveClosedTrades: liveClosed,
    minDemoClosedRequired: TRADE_LIVE_MIN_DEMO_CLOSED,
    graduationEligible,
    graduationViaAcademy: academyBypass,
    liveMarginCapUsdt: liveMarginCapForClosedTrades(liveClosed),
    liveOpenMarginUsdt: openMargin,
    liveDailyLossUsdt: dailyLoss,
    liveDailyLossCapUsdt: tradeLiveDailyLossCapUsdt(),
    custodialProduct: true,
    house,
  };
}

export async function assertCanEnableTradeLive(
  userId: string,
): Promise<
  | { ok: true }
  | { ok: false; error: TradeLiveEnableError; meta?: Record<string, unknown> }
> {
  const db = getDb();
  const [u] = await db
    .select({
      tradeLiveEnabled: users.tradeLiveEnabled,
      tradeLiveDisabledReason: users.tradeLiveDisabledReason,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return { ok: false, error: "trade_live_enable_failed" };
  if (u.tradeLiveEnabled) return { ok: true };
  if (u.tradeLiveDisabledReason?.trim()) {
    return { ok: false, error: "trade_live_admin_disabled" };
  }

  const gov = await getTradeLiveGovernance(userId);
  if (!gov?.graduationEligible) {
    return {
      ok: false,
      error: "trade_live_graduation_required",
      meta: {
        demoClosed: gov?.demoClosedTrades ?? 0,
        required: TRADE_LIVE_MIN_DEMO_CLOSED,
      },
    };
  }

  return { ok: true };
}

export async function recordTradeLiveEvent(args: {
  userId: string;
  action:
    | "enabled"
    | "disabled"
    | "admin_enabled"
    | "admin_disabled"
    | "admin_revoked";
  actorUserId?: string | null;
  reason?: string | null;
  meta?: Record<string, unknown> | null;
  ip?: string | null;
}): Promise<void> {
  const db = getDb();
  await db.insert(tradeLiveEvents).values({
    userId: args.userId,
    action: args.action,
    actorUserId: args.actorUserId ?? null,
    reason: args.reason ?? null,
    meta: args.meta ?? null,
    ip: args.ip ?? null,
  });
}

async function notifyTradeLiveEnabled(args: {
  userId: string;
  email: string;
  locale: EmailLocale;
}): Promise<void> {
  await createUserNotification({
    userId: args.userId,
    kind: "trade_live_enabled",
    payload: { at: new Date().toISOString() },
  });

  const fr = args.locale === "fr";
  const subject = fr
    ? "Trading réel activé sur McBuleli"
    : "Real trading enabled on McBuleli";
  const body = fr
    ? "Vous avez activé le mode réel pour les futures custodial. Les ordres débitent votre wallet USDT sur la plateforme - ce n’est pas un compte exchange externe. Vous pouvez repasser en mode entraînement à tout moment."
    : "You enabled real mode for custodial futures. Orders debit your on-platform USDT wallet - this is not an external exchange account. You can switch back to practice anytime.";

  const { html, text } = renderMcBuleliEmail({
    copy: {
      subject,
      preheader: body.slice(0, 120),
      title: subject,
      body,
      cta: fr ? "Ouvrir Markets" : "Open Markets",
      footerHelp: fr ? "Besoin d’aide ?" : "Need help?",
      footerContact: "support@mcbuleli.org",
    },
    actionUrl: "https://mcbuleli.org/app/market?panel=futures",
    illustration: "security",
    locale: args.locale,
    useInlineImages: true,
  });

  await sendBrandedEmail({ to: args.email, subject, html, text }).catch(
    () => undefined,
  );
}

export async function enableTradeLiveForUser(args: {
  userId: string;
  ip?: string | null;
  locale?: EmailLocale;
}): Promise<
  | { ok: true }
  | { ok: false; error: TradeLiveEnableError; meta?: Record<string, unknown> }
> {
  const gate = await assertCanEnableTradeLive(args.userId);
  if (!gate.ok) return gate;

  const db = getDb();
  const [u] = await db
    .select({ email: users.email, tradeLiveEnabled: users.tradeLiveEnabled })
    .from(users)
    .where(eq(users.id, args.userId))
    .limit(1);
  if (!u) return { ok: false, error: "trade_live_enable_failed" };
  if (u.tradeLiveEnabled) return { ok: true };

  const r = await db
    .update(users)
    .set({
      tradeLiveEnabled: true,
      tradeLiveDisabledReason: null,
      tradeLiveDisabledAt: null,
    })
    .where(eq(users.id, args.userId))
    .returning({ id: users.id });

  if (!r.length) return { ok: false, error: "trade_live_enable_failed" };

  await recordTradeLiveEvent({
    userId: args.userId,
    action: "enabled",
    ip: args.ip ?? null,
  });

  const loc: EmailLocale = args.locale === "en" ? "en" : "fr";
  await notifyTradeLiveEnabled({
    userId: args.userId,
    email: u.email,
    locale: loc,
  });

  return { ok: true };
}

export async function adminSetTradeLive(args: {
  targetUserId: string;
  enabled: boolean;
  reason?: string | null;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  const reason = args.reason?.trim() || null;

  if (!args.enabled && !reason) {
    return { ok: false, error: "reason_required" };
  }

  const patch = args.enabled
    ? {
        tradeLiveEnabled: true,
        tradeLiveDisabledReason: null,
        tradeLiveDisabledAt: null,
      }
    : {
        tradeLiveEnabled: false,
        tradeLiveDisabledReason: reason,
        tradeLiveDisabledAt: new Date(),
      };

  const r = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, args.targetUserId))
    .returning({ id: users.id });

  if (!r.length) return { ok: false, error: "user_not_found" };

  await recordTradeLiveEvent({
    userId: args.targetUserId,
    action: args.enabled ? "admin_enabled" : "admin_revoked",
    actorUserId: args.actorUserId,
    reason,
  });

  if (!args.enabled) {
    await createUserNotification({
      userId: args.targetUserId,
      kind: "trade_live_disabled",
      payload: { reason },
    });
  }

  return { ok: true };
}

export async function assertCanOpenLiveFutures(args: {
  userId: string;
  marginUsdt: number;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const gov = await getTradeLiveGovernance(args.userId);
  if (!gov) return { ok: false, message: "trade_open_failed" };
  if (!gov.tradeLiveEnabled) {
    return { ok: false, message: "trade_live_not_enabled" };
  }
  if (gov.tradeLiveDisabledReason) {
    return { ok: false, message: "trade_live_admin_disabled" };
  }

  if (args.marginUsdt > gov.liveMarginCapUsdt + 1e-9) {
    return { ok: false, message: "trade_live_margin_cap" };
  }

  const projectedOpen = gov.liveOpenMarginUsdt + args.marginUsdt;
  if (projectedOpen > gov.liveMarginCapUsdt * 2 + 1e-9) {
    return { ok: false, message: "trade_live_exposure_cap" };
  }

  if (gov.liveDailyLossUsdt >= gov.liveDailyLossCapUsdt - 1e-9) {
    return { ok: false, message: "trade_live_daily_loss_cap" };
  }

  if (gov.house.circuitTripped) {
    return { ok: false, message: "trade_house_circuit" };
  }

  return { ok: true };
}
