/** Bot plan identifiers (strategy family). */
export const BOT_PLAN_IDS = ["dca_spot", "grid_spot", "futures_um"] as const;
export type BotPlanId = (typeof BOT_PLAN_IDS)[number];

export const BOT_BILLING_MODES = ["demo", "live"] as const;
export type BotBillingMode = (typeof BOT_BILLING_MODES)[number];

export const BOT_ENVIRONMENTS = ["demo", "live"] as const;
export type BotEnvironment = (typeof BOT_ENVIRONMENTS)[number];

export type BotPlanDef = {
  id: BotPlanId;
  /** USDT price when billing = live */
  livePriceUsdt: number;
  /** Debited from trade_demo_usdt_balance when billing = demo */
  demoPriceUsdt: number;
  requiresSpot: boolean;
  requiresFutures: boolean;
};

export const BOT_PLANS: Record<BotPlanId, BotPlanDef> = {
  dca_spot: {
    id: "dca_spot",
    livePriceUsdt: 20,
    demoPriceUsdt: 5,
    requiresSpot: true,
    requiresFutures: false,
  },
  grid_spot: {
    id: "grid_spot",
    livePriceUsdt: 30,
    demoPriceUsdt: 8,
    requiresSpot: true,
    requiresFutures: false,
  },
  futures_um: {
    id: "futures_um",
    livePriceUsdt: 50,
    demoPriceUsdt: 10,
    requiresSpot: false,
    requiresFutures: true,
  },
};

export const BOT_SUBSCRIPTION_DAYS = 30;

export function isBotPlanId(v: string): v is BotPlanId {
  return (BOT_PLAN_IDS as readonly string[]).includes(v);
}

export function planPriceUsdt(
  planId: BotPlanId,
  billing: BotBillingMode,
): number {
  const p = BOT_PLANS[planId];
  return billing === "demo" ? p.demoPriceUsdt : p.livePriceUsdt;
}

/** API keys environment matches billing (demo → testnet, live → production). */
export function billingToKeyEnvironment(
  billing: BotBillingMode,
): BotEnvironment {
  return billing;
}
