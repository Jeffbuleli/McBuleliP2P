import type { BotBillingMode, BotPlanId } from "@/lib/bot-config";
import type { BotTemplateId } from "@/lib/bot-templates";
import type { BotCoordinatedStyleId } from "@/lib/bot-coordinated-config";

export type BotTemplatePostMeta = {
  v: 1;
  templateId: BotTemplateId;
  planId: BotPlanId;
  style: BotCoordinatedStyleId;
  symbol: string;
  billing: BotBillingMode;
  authorHandle: string;
  stats?: {
    tradeCount: number;
    winRate: number | null;
    runtimeDays: number;
    volumeUsdt: number;
  };
};

export function isBotTemplatePostMeta(raw: unknown): raw is BotTemplatePostMeta {
  if (!raw || typeof raw !== "object") return false;
  const m = raw as Record<string, unknown>;
  return (
    m.v === 1 &&
    typeof m.templateId === "string" &&
    typeof m.planId === "string" &&
    typeof m.symbol === "string"
  );
}

export function parseBotTemplatePostMeta(meta: unknown): BotTemplatePostMeta | null {
  if (isBotTemplatePostMeta(meta)) return meta;
  return null;
}

export function botTemplateShareBody(meta: BotTemplatePostMeta, fr: boolean): string {
  const plan =
    meta.planId === "dca_spot"
      ? "DCA"
      : meta.planId === "grid_spot"
        ? fr
          ? "Grille"
          : "Grid"
        : "Futures";
  const style = meta.style === "swing" ? "Swing" : "Day";
  const stats = meta.stats;
  const perf =
    stats && stats.tradeCount > 0
      ? fr
        ? ` · ${stats.tradeCount} trades${stats.winRate != null ? ` · ${stats.winRate}% WR` : ""}`
        : ` · ${stats.tradeCount} trades${stats.winRate != null ? ` · ${stats.winRate}% WR` : ""}`
      : "";
  return fr
    ? `Stratégie bot ${plan} · ${meta.symbol} · ${style}${perf}`
    : `Bot strategy ${plan} · ${meta.symbol} · ${style}${perf}`;
}

export function botTemplateTradeHref(meta: BotTemplatePostMeta): string {
  const q = new URLSearchParams({
    template: meta.templateId,
    billing: meta.billing,
    panel: "bots",
  });
  return `/app/market?${q}`;
}
