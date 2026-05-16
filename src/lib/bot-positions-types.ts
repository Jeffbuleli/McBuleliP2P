export type BotOpenPositionRow = {
  kind: "futures" | "spot_order" | "spot_holding";
  symbol: string;
  side?: string;
  size?: string;
  entryPrice?: string;
  markPrice?: string;
  unrealizedPnl?: string;
  price?: string;
  quantity?: string;
  notionalUsdt?: string;
};
