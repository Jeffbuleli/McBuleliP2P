import type { BotPlanId } from "@/lib/bot-config";
import type { BotCoordinatedStyleId } from "@/lib/bot-coordinated-config";
import {
  buildCoordinatedDcaConfig,
  buildCoordinatedFuturesConfig,
  buildCoordinatedGridConfig,
} from "@/lib/bot-coordinated-config";

export const BOT_TEMPLATE_IDS = [
  "dca_day_btc",
  "dca_swing_eth",
  "grid_day_btc",
  "grid_swing_sol",
  "fut_day_btc_long",
  "fut_swing_eth_long",
] as const;

export type BotTemplateId = (typeof BOT_TEMPLATE_IDS)[number];

export type BotTemplateDef = {
  id: BotTemplateId;
  planId: BotPlanId;
  style: BotCoordinatedStyleId;
  symbol: string;
  /** i18n label key */
  labelKey: string;
  /** Short tag key */
  tagKey: string;
};

export const BOT_TEMPLATES: BotTemplateDef[] = [
  {
    id: "dca_day_btc",
    planId: "dca_spot",
    style: "day",
    symbol: "BTCUSDT",
    labelKey: "bots_tpl_dca_day_btc",
    tagKey: "bots_tpl_tag_day",
  },
  {
    id: "dca_swing_eth",
    planId: "dca_spot",
    style: "swing",
    symbol: "ETHUSDT",
    labelKey: "bots_tpl_dca_swing_eth",
    tagKey: "bots_tpl_tag_swing",
  },
  {
    id: "grid_day_btc",
    planId: "grid_spot",
    style: "day",
    symbol: "BTCUSDT",
    labelKey: "bots_tpl_grid_day_btc",
    tagKey: "bots_tpl_tag_day",
  },
  {
    id: "grid_swing_sol",
    planId: "grid_spot",
    style: "swing",
    symbol: "SOLUSDT",
    labelKey: "bots_tpl_grid_swing_sol",
    tagKey: "bots_tpl_tag_swing",
  },
  {
    id: "fut_day_btc_long",
    planId: "futures_um",
    style: "day",
    symbol: "BTCUSDT",
    labelKey: "bots_tpl_fut_day_btc",
    tagKey: "bots_tpl_tag_day",
  },
  {
    id: "fut_swing_eth_long",
    planId: "futures_um",
    style: "swing",
    symbol: "ETHUSDT",
    labelKey: "bots_tpl_fut_swing_eth",
    tagKey: "bots_tpl_tag_swing",
  },
];

export function getBotTemplate(id: string): BotTemplateDef | null {
  return BOT_TEMPLATES.find((t) => t.id === id) ?? null;
}

export function templatesForPlan(planId: BotPlanId): BotTemplateDef[] {
  return BOT_TEMPLATES.filter((t) => t.planId === planId);
}

function gridBandPct(style: BotCoordinatedStyleId): number {
  return style === "swing" ? 0.12 : 0.06;
}

export function gridRangeFromMark(
  mark: number,
  style: BotCoordinatedStyleId,
): { low: string; high: string } {
  const band = gridBandPct(style);
  const low = mark * (1 - band);
  const high = mark * (1 + band);
  const decimals = mark >= 1000 ? 0 : mark >= 1 ? 2 : 4;
  return {
    low: low.toFixed(decimals),
    high: high.toFixed(decimals),
  };
}

export type TemplateFormPatch = {
  planId: BotPlanId;
  style: BotCoordinatedStyleId;
  dca?: { symbol: string; quoteAmountUsdt: string; intervalHours: number };
  grid?: {
    symbol: string;
    priceLow: string;
    priceHigh: string;
    gridCount: number;
    quotePerGrid: string;
    refreshHours: number;
  };
  futures?: {
    symbol: string;
    side: "LONG" | "SHORT";
    leverage: number;
    marginUsdt: string;
    intervalHours: number;
    stopLossPct: number;
    takeProfitPct: number;
  };
};

/** Map template + optional mark price → form field values. */
export function buildTemplateFormPatch(
  template: BotTemplateDef,
  markPrice?: number,
): TemplateFormPatch {
  const { style, planId, symbol } = template;

  if (planId === "dca_spot") {
    return {
      planId,
      style,
      dca: {
        symbol,
        quoteAmountUsdt: style === "day" ? "20" : "15",
        intervalHours: style === "day" ? 4 : 24,
      },
    };
  }

  if (planId === "grid_spot") {
    const mark = markPrice && markPrice > 0 ? markPrice : symbol === "SOLUSDT" ? 140 : 95000;
    const { low, high } = gridRangeFromMark(mark, style);
    return {
      planId,
      style,
      grid: {
        symbol,
        priceLow: low,
        priceHigh: high,
        gridCount: style === "day" ? 6 : 8,
        quotePerGrid: style === "day" ? "12" : "10",
        refreshHours: style === "day" ? 4 : 12,
      },
    };
  }

  return {
    planId,
    style,
    futures: {
      symbol,
      side: "LONG",
      leverage: style === "day" ? 5 : 3,
      marginUsdt: style === "day" ? "50" : "40",
      intervalHours: style === "day" ? 4 : 24,
      stopLossPct: style === "day" ? 3 : 5,
      takeProfitPct: style === "day" ? 6 : 12,
    },
  };
}

export function templateConfigPayload(
  patch: TemplateFormPatch,
): Record<string, unknown> | null {
  if (patch.planId === "dca_spot" && patch.dca) {
    return buildCoordinatedDcaConfig(patch.dca, patch.style);
  }
  if (patch.planId === "grid_spot" && patch.grid) {
    return buildCoordinatedGridConfig(patch.grid, patch.style);
  }
  if (patch.planId === "futures_um" && patch.futures) {
    return buildCoordinatedFuturesConfig(patch.futures, patch.style);
  }
  return null;
}
