import type { BotEnvironment } from "@/lib/bot-config";
import type { StoredBinanceCredentials } from "@/lib/bot-keys-crypto";
import {
  binanceUserSignedGet,
  binanceUserSignedPost,
} from "@/lib/binance-user-client";
import { fetchBinanceApiRestrictions } from "@/lib/binance-api-validate";

export type FuturesApiKind = "fapi" | "papi";

/**
 * Demo: keys from demo.binance.com → demo-fapi.binance.com only (always fapi).
 * Live: keys from binance.com → fapi.binance.com or papi.binance.com (PM).
 */
export async function resolveFuturesApiKind(
  environment: BotEnvironment,
  creds: StoredBinanceCredentials,
  storedKind?: "fapi" | "papi" | null,
): Promise<FuturesApiKind> {
  if (environment === "demo") return "fapi";

  if (storedKind === "papi" || storedKind === "fapi") return storedKind;

  const restrictions = await fetchBinanceApiRestrictions(environment, creds);
  if (restrictions?.enablePortfolioMarginTrading === true) return "papi";
  if (restrictions?.enableFutures === true) return "fapi";

  try {
    await binanceUserSignedGet({
      environment,
      creds,
      market: "portfolio",
      path: "/papi/v1/um/account",
    });
    return "papi";
  } catch {
    return "fapi";
  }
}

function routes(kind: FuturesApiKind) {
  if (kind === "papi") {
    return {
      market: "portfolio" as const,
      positionRisk: "/papi/v1/um/positionRisk",
      leverage: "/papi/v1/um/leverage",
      order: "/papi/v1/um/order",
    };
  }
  return {
    market: "futures" as const,
    positionRisk: "/fapi/v2/positionRisk",
    leverage: "/fapi/v1/leverage",
    order: "/fapi/v1/order",
  };
}

export async function futuresSignedGet(args: {
  environment: BotEnvironment;
  creds: StoredBinanceCredentials;
  kind: FuturesApiKind;
  pathKey: "positionRisk";
  params?: Record<string, string>;
}): Promise<unknown> {
  const r = routes(args.kind);
  return binanceUserSignedGet({
    environment: args.environment,
    creds: args.creds,
    market: r.market,
    path: r[args.pathKey],
    params: args.params,
  });
}

export async function futuresSignedPost(args: {
  environment: BotEnvironment;
  creds: StoredBinanceCredentials;
  kind: FuturesApiKind;
  pathKey: "leverage" | "order";
  params: Record<string, string>;
}): Promise<unknown> {
  const r = routes(args.kind);
  return binanceUserSignedPost({
    environment: args.environment,
    creds: args.creds,
    market: r.market,
    path: r[args.pathKey],
    params: args.params,
  });
}
