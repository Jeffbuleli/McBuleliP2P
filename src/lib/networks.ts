export type NetworkId = "TRC20" | "ERC20" | "BEP20";

/** Deposit provider — Binance (USDT) or OKX (Pi Network). */
export type CexId = "binance" | "okx";

export type NetworkSpec = {
  id: NetworkId;
  label: string;
  /** Binance `network` parameter for USDT deposits / withdrawals */
  binanceNetwork: string;
  /** UI accent */
  badgeClass: string;
  /** Approximate confirmations shown to user */
  defaultConfirmations: number;
};

export const USDT_NETWORKS: Record<NetworkId, NetworkSpec> = {
  TRC20: {
    id: "TRC20",
    label: "TRC20 (Tron)",
    binanceNetwork: "TRX",
    badgeClass: "bg-emerald-600 text-white",
    defaultConfirmations: 19,
  },
  ERC20: {
    id: "ERC20",
    label: "ERC20 (Ethereum)",
    binanceNetwork: "ETH",
    badgeClass: "bg-sky-600 text-white",
    defaultConfirmations: 12,
  },
  BEP20: {
    id: "BEP20",
    label: "BEP20 (BSC)",
    binanceNetwork: "BSC",
    badgeClass: "bg-amber-400 text-stone-900",
    defaultConfirmations: 15,
  },
};

export const ASSETS = ["USDT", "PI"] as const;
export type AssetId = (typeof ASSETS)[number];

export function parseNetwork(id: string): NetworkId | null {
  if (id === "TRC20" || id === "ERC20" || id === "BEP20") return id;
  return null;
}

export function normalizeTxid(txid: string): string {
  return txid.trim();
}

/** Map CEX-reported network names to our canonical network for comparison */
export function canonicalFromBinanceNetwork(
  coin: string,
  reported: string | undefined,
): NetworkId | null {
  const n = (reported ?? "").toUpperCase();
  if (coin.toUpperCase() !== "USDT") return null;
  if (n === "TRX" || n === "TRC20") return "TRC20";
  if (n === "ETH" || n === "ERC20") return "ERC20";
  if (n === "BSC" || n === "BEP20" || n === "BNB") return "BEP20";
  return null;
}
