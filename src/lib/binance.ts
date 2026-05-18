import crypto from "node:crypto";
import type { NetworkId } from "./networks";
import { USDT_NETWORKS } from "./networks";
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
  const key = process.env.BINANCE_API_KEY?.trim();
  const secret = process.env.BINANCE_API_SECRET?.trim();
  if (!key || !secret) {
    throw new Error("Binance API credentials are not configured");
  }
  return { key, secret };
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
}) {
  const net = USDT_NETWORKS[args.network].binanceNetwork;
  const params: Record<string, string> = {
    coin: args.coin,
    network: net,
    address: args.address,
    amount: args.amount,
  };
  if (args.tag) params.addressTag = args.tag;
  return signedPost("/sapi/v1/capital/withdraw/apply", params) as Promise<{
    id: string;
  }>;
}
