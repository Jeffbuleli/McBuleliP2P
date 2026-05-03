export type NetworkId = "TRC20" | "ERC20" | "BEP20";

export type CexId = "binance" | "okx";

export type NetworkSpec = {
  id: NetworkId;
  label: string;
  /** Binance `network` parameter for USDT deposits */
  binanceNetwork: string;
  /** OKX `chain` parameter for USDT */
  okxChain: string;
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
    okxChain: "USDT-TRC20",
    badgeClass: "bg-emerald-600 text-white",
    defaultConfirmations: 19,
  },
  ERC20: {
    id: "ERC20",
    label: "ERC20 (Ethereum)",
    binanceNetwork: "ETH",
    okxChain: "USDT-ERC20",
    badgeClass: "bg-sky-600 text-white",
    defaultConfirmations: 12,
  },
  BEP20: {
    id: "BEP20",
    label: "BEP20 (BSC)",
    binanceNetwork: "BSC",
    okxChain: "USDT-BEP20",
    badgeClass: "bg-amber-400 text-stone-900",
    defaultConfirmations: 15,
  },
};

export const ASSETS = ["USDT"] as const;
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

export function canonicalFromOkxChain(chain: string | undefined): NetworkId | null {
  const c = (chain ?? "").toUpperCase();
  if (c.includes("TRC20") || c.includes("TRON")) return "TRC20";
  if (c.includes("ERC20") || c === "USDT-ETH") return "ERC20";
  if (c.includes("BEP20") || c.includes("BSC")) return "BEP20";
  return null;
}
