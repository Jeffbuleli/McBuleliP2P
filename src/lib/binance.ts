import crypto from "node:crypto";
import type { NetworkId } from "./networks";
import { USDT_NETWORKS } from "./networks";

const BASE = process.env.BINANCE_API_BASE ?? "https://api.binance.com";

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

export async function signedPost(path: string, params: Record<string, string>) {
  const { key, secret } = getCredentials();
  const merged = withTimestamp(params);
  const qs = sortedQueryString(merged);
  const signature = sign(qs, secret);
  const body = `${qs}&signature=${signature}`;
  const url = `${BASE}${path}`;
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
  const url = `${BASE}${path}?${qs}&signature=${signature}`;
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
