import crypto from "node:crypto";
import type { NetworkId } from "./networks";
import { canonicalFromBinanceNetwork, USDT_NETWORKS } from "./networks";
import { getBinanceWalletCredentials } from "@/lib/env";
import {
  binanceWalletApiBase,
  classifyBinanceWalletAuthError,
} from "@/lib/binance-wallet-config";

function sign(query: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(query).digest("hex");
}

/** Binance requires HMAC over alphabetically sorted query parameters (excluding signature). */
function sortedQueryString(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
}

function getCredentials() {
  return getBinanceWalletCredentials();
}

function withTimestamp(params: Record<string, string>) {
  const recvWindow = process.env.BINANCE_RECV_WINDOW ?? "5000";
  return {
    ...params,
    recvWindow,
    timestamp: Date.now().toString(),
  };
}

function walletBase() {
  return binanceWalletApiBase();
}

export async function signedPost(path: string, params: Record<string, string>) {
  const { key, secret } = getCredentials();
  const merged = withTimestamp(params);
  const qs = sortedQueryString(merged);
  const signature = sign(qs, secret);
  const body = `${qs}&signature=${signature}`;
  const url = `${walletBase()}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-MBX-APIKEY": key,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  const json = (await res.json()) as unknown;
  if (!res.ok) {
    throw new Error(`Binance HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function signedGet(path: string, params: Record<string, string>) {
  const { key, secret } = getCredentials();
  const merged = withTimestamp(params);
  const qs = sortedQueryString(merged);
  const signature = sign(qs, secret);
  const url = `${walletBase()}${path}?${qs}&signature=${signature}`;
  const res = await fetch(url, {
    headers: { "X-MBX-APIKEY": key },
    cache: "no-store",
  });
  const json = (await res.json()) as unknown;
  if (!res.ok) {
    throw new Error(`Binance HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

export type PlatformBinanceApiRestrictions = {
  ipRestrict: boolean;
  enableReading: boolean;
  enableWithdrawals: boolean;
  enableSpotAndMarginTrading: boolean;
  enableFutures: boolean;
};

/** Platform .env key — same fields bots read on live user keys. */
export async function fetchPlatformBinanceApiRestrictions(): Promise<PlatformBinanceApiRestrictions | null> {
  try {
    return (await signedGet("/sapi/v1/account/apiRestrictions", {})) as PlatformBinanceApiRestrictions;
  } catch {
    return null;
  }
}

/** Spot ping with platform .env keys (same check as BOT LIVE Spot validation). */
export async function probePlatformBinanceSpot(): Promise<boolean> {
  try {
    await signedGet("/api/v3/account", {});
    return true;
  } catch {
    return false;
  }
}

/** User-facing error code for wallet Binance failures (deposit/withdraw rails). */
export async function binanceWalletErrorCode(e: unknown): Promise<string> {
  const msg = e instanceof Error ? e.message : String(e);
  let hint: Parameters<typeof classifyBinanceWalletAuthError>[1];
  if (msg.includes("-2015")) {
    const restrictions = await fetchPlatformBinanceApiRestrictions();
    if (restrictions) {
      hint = {
        enableReading: restrictions.enableReading,
        enableWithdrawals: restrictions.enableWithdrawals,
        ipRestrict: restrictions.ipRestrict,
        spotOk: await probePlatformBinanceSpot(),
      };
    }
  }
  return classifyBinanceWalletAuthError(msg, hint);
}

export async function binanceDepositAddress(args: {
  coin: string;
  network: NetworkId;
}) {
  const net = USDT_NETWORKS[args.network].binanceNetwork;
  return signedGet("/sapi/v1/capital/deposit/address", {
    coin: args.coin,
    network: net,
  }) as Promise<{ address: string; coin: string; tag?: string }>;
}

export type BinanceDepositRow = {
  amount: string;
  coin: string;
  network: string;
  status: number;
  address: string;
  addressTag?: string;
  txId: string;
  confirmTimes?: string;
  insertTime?: number;
};

export async function binanceDepositHistoryByTxid(args: {
  coin: string;
  txId: string;
}) {
  const rows = (await signedGet("/sapi/v1/capital/deposit/hisrec", {
    coin: args.coin,
    txId: args.txId,
  })) as BinanceDepositRow[];
  return Array.isArray(rows) ? rows : [];
}

export async function binanceRecentDepositHistory(args: {
  coin: string;
  startTimeMs: number;
  endTimeMs?: number;
  limit?: number;
}) {
  const rows = (await signedGet("/sapi/v1/capital/deposit/hisrec", {
    coin: args.coin,
    startTime: String(args.startTimeMs),
    ...(args.endTimeMs ? { endTime: String(args.endTimeMs) } : {}),
    ...(args.limit ? { limit: String(args.limit) } : {}),
  })) as BinanceDepositRow[];
  return Array.isArray(rows) ? rows : [];
}

/**
 * Binance deposit status varies by endpoint version.
 * We treat "credited" when status is 1 or 6, or when confirmations are recorded.
 */
export function binanceDepositIsSuccessful(row: BinanceDepositRow): boolean {
  if (row.status === 1 || row.status === 6) return true;
  const c = Number(row.confirmTimes ?? 0);
  return Number.isFinite(c) && c > 0;
}

export async function binanceWithdraw(args: {
  coin: string;
  network: NetworkId;
  address: string;
  amount: string;
  tag?: string;
  /** Client id for idempotency — maps to Binance `withdrawOrderId`. */
  withdrawOrderId?: string;
  /** 0 = spot wallet (default), 1 = funding wallet. */
  walletType?: 0 | 1;
  /** When true, network fee is charged to destination on internal transfers. */
  transactionFeeFlag?: boolean;
}) {
  const net = USDT_NETWORKS[args.network].binanceNetwork;
  const params: Record<string, string> = {
    coin: args.coin,
    network: net,
    address: args.address.trim(),
    amount: formatBinanceUsdtAmount(args.amount),
    walletType: String(args.walletType ?? 0),
  };
  if (args.tag?.trim()) params.addressTag = args.tag.trim();
  if (args.withdrawOrderId?.trim()) {
    params.withdrawOrderId = args.withdrawOrderId.trim().slice(0, 64);
  }
  if (args.transactionFeeFlag === true) {
    params.transactionFeeFlag = "true";
  }
  return signedPost("/sapi/v1/capital/withdraw/apply", params) as Promise<{
    id: string;
  }>;
}

/** Binance USDT withdraw amount — max 8 decimals, no trailing zeros. */
export function formatBinanceUsdtAmount(amount: string | number): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("invalid_withdraw_amount");
  }
  const fixed = n.toFixed(8);
  return fixed.replace(/\.?0+$/, "") || "0";
}

/**
 * Amount passed to `POST /sapi/v1/capital/withdraw/apply`.
 * External on-chain: Binance deducts network fee from the apply amount — send net + fee
 * so the destination receives exactly `net`. Internal: fee is 0 — send net only.
 */
export async function binanceUsdtWithdrawApplyAmount(args: {
  network: NetworkId;
  address: string;
  netAmount: string | number;
}): Promise<{ applyAmount: string; isInternal: boolean; binanceFee: number }> {
  const net = Number(args.netAmount);
  if (!Number.isFinite(net) || net <= 0) {
    throw new Error("invalid_withdraw_amount");
  }

  const isInternal = await isKnownBinanceInternalWithdrawAddress({
    network: args.network,
    address: args.address,
  });

  if (isInternal) {
    return {
      applyAmount: formatBinanceUsdtAmount(net),
      isInternal: true,
      binanceFee: 0,
    };
  }

  const binanceFee = await binanceUsdtWithdrawFee(args.network);
  return {
    applyAmount: formatBinanceUsdtAmount(net + binanceFee),
    isInternal: false,
    binanceFee,
  };
}

export async function binanceWithdrawUsdt(args: {
  network: NetworkId;
  address: string;
  netAmount: string;
  withdrawOrderId?: string;
  tag?: string;
}) {
  const { applyAmount } = await binanceUsdtWithdrawApplyAmount({
    network: args.network,
    address: args.address,
    netAmount: args.netAmount,
  });
  return binanceWithdraw({
    coin: "USDT",
    network: args.network,
    address: args.address,
    amount: applyAmount,
    tag: args.tag,
    withdrawOrderId: args.withdrawOrderId,
    walletType: 0,
  });
}

export type BinanceCoinNetworkConfig = {
  network: string;
  withdrawFee: string;
  withdrawMin?: string;
  withdrawInternalMin?: string;
  withdrawEnable?: boolean;
  withdrawTag?: boolean;
};

export type BinanceUsdtNetworkWithdrawConfig = {
  withdrawFee: number;
  withdrawMin: number;
  withdrawInternalMin: number;
  withdrawTag: boolean;
};

export type BinanceCoinConfig = {
  coin: string;
  networkList: BinanceCoinNetworkConfig[];
};

let coinConfigCache: { at: number; rows: BinanceCoinConfig[] } | null = null;
const COIN_CONFIG_CACHE_MS = 5 * 60 * 1000;

async function fetchBinanceCoinConfigs(): Promise<BinanceCoinConfig[]> {
  const now = Date.now();
  if (coinConfigCache && now - coinConfigCache.at < COIN_CONFIG_CACHE_MS) {
    return coinConfigCache.rows;
  }
  const rows = (await signedGet("/sapi/v1/capital/config/getall", {})) as BinanceCoinConfig[];
  const list = Array.isArray(rows) ? rows : [];
  coinConfigCache = { at: now, rows: list };
  return list;
}

function usdtNetworkRow(network: NetworkId) {
  return fetchBinanceCoinConfigs().then((configs) => {
    const usdt = configs.find((c) => c.coin === "USDT");
    const binanceNet = USDT_NETWORKS[network].binanceNetwork;
    return usdt?.networkList?.find((n) => n.network === binanceNet) ?? null;
  });
}

/** Binance USDT withdrawal network fee (catalogue; 0 on internal transfer). */
export async function binanceUsdtWithdrawFee(network: NetworkId): Promise<number> {
  const row = await usdtNetworkRow(network);
  const fee = Number(row?.withdrawFee ?? 0);
  return Number.isFinite(fee) && fee >= 0 ? fee : 0;
}

/** Live mins + fee for a USDT network from `config/getall`. */
export async function binanceUsdtNetworkWithdrawConfig(
  network: NetworkId,
): Promise<BinanceUsdtNetworkWithdrawConfig> {
  const row = await usdtNetworkRow(network);
  const withdrawFee = Number(row?.withdrawFee ?? 0);
  const withdrawMin = Number(row?.withdrawMin ?? 5);
  const withdrawInternalMin = Number(row?.withdrawInternalMin ?? 0.000001);
  return {
    withdrawFee: Number.isFinite(withdrawFee) && withdrawFee >= 0 ? withdrawFee : 0,
    withdrawMin: Number.isFinite(withdrawMin) && withdrawMin > 0 ? withdrawMin : 5,
    withdrawInternalMin:
      Number.isFinite(withdrawInternalMin) && withdrawInternalMin > 0
        ? withdrawInternalMin
        : 0.000001,
    withdrawTag: Boolean(row?.withdrawTag),
  };
}

export function normalizeWithdrawAddressForNetwork(
  network: NetworkId,
  address: string,
): string {
  const trimmed = address.trim();
  if (network === "TRC20") return trimmed;
  return trimmed.toLowerCase();
}

export function withdrawAddressCacheKey(
  network: NetworkId,
  address: string,
): string {
  return `${network}:${normalizeWithdrawAddressForNetwork(network, address)}`;
}

function parseInternalAddressAllowlist(): Set<string> {
  const raw = process.env.BINANCE_INTERNAL_WITHDRAW_ADDRESSES?.trim();
  if (!raw) return new Set();
  const keys = new Set<string>();
  for (const part of raw.split(",")) {
    const p = part.trim();
    if (!p) continue;
    const colon = p.indexOf(":");
    if (colon <= 0) continue;
    const net = p.slice(0, colon);
    const addr = p.slice(colon + 1);
    if (
      (net === "TRC20" || net === "ERC20" || net === "BEP20") &&
      addr.length >= 10
    ) {
      keys.add(withdrawAddressCacheKey(net as NetworkId, addr));
    }
  }
  return keys;
}

export type BinanceWithdrawHistoryRow = {
  id: string;
  amount: string;
  transactionFee: string;
  coin: string;
  status: number;
  txId?: string;
  address?: string;
  network?: string;
  /** 1 = internal Binance transfer, 0 = on-chain */
  transferType?: number;
};

let internalAddressCache: { at: number; keys: Set<string> } | null = null;
const INTERNAL_ADDR_CACHE_MS = 5 * 60 * 1000;

/** Addresses previously withdrawn to with zero network fee (Binance internal). */
export async function refreshBinanceInternalWithdrawAddresses(): Promise<Set<string>> {
  const now = Date.now();
  if (
    internalAddressCache &&
    now - internalAddressCache.at < INTERNAL_ADDR_CACHE_MS
  ) {
    return internalAddressCache.keys;
  }
  const keys = new Set(parseInternalAddressAllowlist());
  try {
    const rows = (await signedGet("/sapi/v1/capital/withdraw/history", {
      coin: "USDT",
    })) as BinanceWithdrawHistoryRow[];
    if (Array.isArray(rows)) {
      for (const row of rows) {
        if (!row.address || !row.network) continue;
        const fee = Number(row.transactionFee ?? NaN);
        const tx = (row.txId ?? "").trim().toLowerCase();
        const internal =
          row.transferType === 1 ||
          (Number.isFinite(fee) && fee === 0) ||
          tx === "internal";
        if (!internal) continue;
        const canonical = canonicalFromBinanceNetwork("USDT", row.network);
        if (!canonical) continue;
        keys.add(withdrawAddressCacheKey(canonical, row.address));
      }
    }
  } catch {
    /* allowlist only */
  }
  internalAddressCache = { at: now, keys };
  return keys;
}

export async function isKnownBinanceInternalWithdrawAddress(args: {
  network: NetworkId;
  address: string;
}): Promise<boolean> {
  const keys = await refreshBinanceInternalWithdrawAddresses();
  return keys.has(withdrawAddressCacheKey(args.network, args.address));
}

export async function binanceWithdrawHistoryById(
  withdrawId: string,
): Promise<BinanceWithdrawHistoryRow | null> {
  const rows = (await signedGet("/sapi/v1/capital/withdraw/history", {
    coin: "USDT",
  })) as BinanceWithdrawHistoryRow[];
  if (!Array.isArray(rows)) return null;
  return rows.find((r) => r.id === withdrawId) ?? null;
}
