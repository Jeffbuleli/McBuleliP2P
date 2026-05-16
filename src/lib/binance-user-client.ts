import crypto from "node:crypto";
import type { BotEnvironment } from "@/lib/bot-config";
import { binanceEndpointsFor } from "@/lib/binance-endpoints";
import type { StoredBinanceCredentials } from "@/lib/bot-keys-crypto";

function sign(query: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(query).digest("hex");
}

function sortedQueryString(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
}

function withTimestamp(params: Record<string, string>) {
  const recvWindow = process.env.BINANCE_RECV_WINDOW ?? "5000";
  return {
    ...params,
    recvWindow,
    timestamp: Date.now().toString(),
  };
}

function restBase(
  bases: ReturnType<typeof binanceEndpointsFor>,
  market: "spot" | "futures" | "portfolio",
): string {
  if (market === "spot") return bases.spotRest;
  if (market === "portfolio") return bases.portfolioRest;
  return bases.futuresRest;
}

export async function binanceUserSignedGet(args: {
  environment: BotEnvironment;
  creds: StoredBinanceCredentials;
  market: "spot" | "futures" | "portfolio";
  path: string;
  params?: Record<string, string>;
}): Promise<unknown> {
  const bases = binanceEndpointsFor(args.environment);
  const base = restBase(bases, args.market);
  const merged = withTimestamp(args.params ?? {});
  const qs = sortedQueryString(merged);
  const signature = sign(qs, args.creds.apiSecret);
  const url = `${base}${args.path}?${qs}&signature=${signature}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "X-MBX-APIKEY": args.creds.apiKey },
    cache: "no-store",
  });
  const json = (await res.json()) as unknown;
  if (!res.ok) {
    const err = new Error(
      `Binance ${args.market} HTTP ${res.status}: ${JSON.stringify(json)}`,
    );
    (err as Error & { binanceBody?: unknown }).binanceBody = json;
    throw err;
  }
  return json;
}

export async function binanceUserSignedPost(args: {
  environment: BotEnvironment;
  creds: StoredBinanceCredentials;
  market: "spot" | "futures" | "portfolio";
  path: string;
  params: Record<string, string>;
}): Promise<unknown> {
  const bases = binanceEndpointsFor(args.environment);
  const base = restBase(bases, args.market);
  const merged = withTimestamp(args.params);
  const qs = sortedQueryString(merged);
  const signature = sign(qs, args.creds.apiSecret);
  const body = `${qs}&signature=${signature}`;
  const url = `${base}${args.path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-MBX-APIKEY": args.creds.apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  const json = (await res.json()) as unknown;
  if (!res.ok) {
    const err = new Error(
      `Binance ${args.market} HTTP ${res.status}: ${JSON.stringify(json)}`,
    );
    (err as Error & { binanceBody?: unknown }).binanceBody = json;
    throw err;
  }
  return json;
}

export async function binanceUserSignedDelete(args: {
  environment: BotEnvironment;
  creds: StoredBinanceCredentials;
  market: "spot" | "futures" | "portfolio";
  path: string;
  params: Record<string, string>;
}): Promise<unknown> {
  const bases = binanceEndpointsFor(args.environment);
  const base = restBase(bases, args.market);
  const merged = withTimestamp(args.params);
  const qs = sortedQueryString(merged);
  const signature = sign(qs, args.creds.apiSecret);
  const url = `${base}${args.path}?${qs}&signature=${signature}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { "X-MBX-APIKEY": args.creds.apiKey },
    cache: "no-store",
  });
  const json = (await res.json()) as unknown;
  if (!res.ok) {
    const err = new Error(
      `Binance ${args.market} HTTP ${res.status}: ${JSON.stringify(json)}`,
    );
    (err as Error & { binanceBody?: unknown }).binanceBody = json;
    throw err;
  }
  return json;
}

export async function fetchBinanceSpotPrice(
  environment: BotEnvironment,
  symbol: string,
): Promise<number | null> {
  const base = binanceEndpointsFor(environment).spotRest;
  const res = await fetch(
    `${base}/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`,
    { cache: "no-store" },
  );
  const json = (await res.json()) as { price?: string };
  if (!res.ok) return null;
  const n = Number(json.price);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function fetchBinanceFuturesMarkPrice(
  environment: BotEnvironment,
  symbol: string,
): Promise<number | null> {
  const base = binanceEndpointsFor(environment).futuresRest;
  const sym = symbol.toUpperCase();
  const res = await fetch(
    `${base}/fapi/v1/premiumIndex?symbol=${sym}`,
    { cache: "no-store" },
  );
  const json = (await res.json()) as { markPrice?: string };
  if (!res.ok) return null;
  const n = Number(json.markPrice);
  return Number.isFinite(n) && n > 0 ? n : null;
}
