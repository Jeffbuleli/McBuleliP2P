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

export async function binanceUserSignedGet(args: {
  environment: BotEnvironment;
  creds: StoredBinanceCredentials;
  market: "spot" | "futures";
  path: string;
  params?: Record<string, string>;
}): Promise<unknown> {
  const bases = binanceEndpointsFor(args.environment);
  const base =
    args.market === "spot" ? bases.spotRest : bases.futuresRest;
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
