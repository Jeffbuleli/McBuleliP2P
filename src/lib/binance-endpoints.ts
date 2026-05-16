import type { BotEnvironment } from "@/lib/bot-config";

export type BinanceEndpointSet = {
  spotRest: string;
  futuresRest: string;
};

/** REST bases for user API validation and future bot execution. */
export function binanceEndpointsFor(
  environment: BotEnvironment,
): BinanceEndpointSet {
  if (environment === "demo") {
    return {
      spotRest: "https://testnet.binance.vision",
      futuresRest: "https://testnet.binancefuture.com",
    };
  }
  return {
    spotRest: "https://api.binance.com",
    futuresRest: "https://fapi.binance.com",
  };
}
