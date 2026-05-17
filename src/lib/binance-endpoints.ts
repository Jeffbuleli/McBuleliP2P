import type { BotEnvironment } from "@/lib/bot-config";

export type BinanceEndpointSet = {
  spotRest: string;
  /** Classic USDⓈ-M (fapi) — demo uses Binance Futures Demo. */
  futuresRest: string;
  /** Portfolio Margin unified account (live). */
  portfolioRest: string;
};

/**
 * REST bases for user API validation and bot execution.
 * @see https://developers.binance.com/docs/derivatives/usds-margined-futures/general-info
 * @see https://developers.binance.com/docs/derivatives/portfolio-margin/general-info
 */
export function binanceEndpointsFor(
  environment: BotEnvironment,
): BinanceEndpointSet {
  if (environment === "demo") {
    return {
      /** Keys from https://demo.binance.com → API Management */
      spotRest: "https://demo-api.binance.com",
      /** USDⓈ-M demo REST (browser 403 on root URL is normal). */
      futuresRest: "https://demo-fapi.binance.com",
      portfolioRest: "https://demo-fapi.binance.com",
    };
  }
  return {
    spotRest: "https://api.binance.com",
    futuresRest: "https://fapi.binance.com",
    portfolioRest: "https://papi.binance.com",
  };
}
