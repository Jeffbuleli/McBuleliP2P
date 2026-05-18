import { binanceEndpointsFor } from "@/lib/binance-endpoints";
import type { BotEnvironment } from "@/lib/bot-config";

/** Server wallet rails (deposit address, deposit history) — demo.binance.com vs binance.com. */
export function binanceWalletEnvironment(): BotEnvironment {
  const explicit = process.env.BINANCE_ENV?.trim().toLowerCase();
  if (explicit === "demo" || explicit === "testnet") return "demo";
  if (explicit === "live" || explicit === "production" || explicit === "prod") {
    return "live";
  }

  const testnet = process.env.BINANCE_TESTNET?.trim().toLowerCase();
  if (testnet === "1" || testnet === "true" || testnet === "yes") {
    return "demo";
  }

  const base = process.env.BINANCE_API_BASE?.trim().toLowerCase() ?? "";
  if (base.includes("demo-api") || base.includes("testnet.binance")) {
    return "demo";
  }

  return "live";
}

/** REST base for signed wallet endpoints (/sapi/v1/capital/*). */
export function binanceWalletApiBase(): string {
  const override = process.env.BINANCE_API_BASE?.trim();
  if (override) return override.replace(/\/+$/, "");
  return binanceEndpointsFor(binanceWalletEnvironment()).spotRest;
}

export function binanceWalletPortalLabel(env: BotEnvironment): string {
  return env === "demo" ? "demo.binance.com" : "binance.com";
}

/**
 * Map Binance HTTP body to i18n keys for deposit/withdraw rails.
 * -2015 almost always means wrong host for the key or IP whitelist.
 */
export function classifyBinanceWalletAuthError(raw: string): string {
  const env = binanceWalletEnvironment();
  const lower = raw.toLowerCase();

  if (
    lower.includes("ip") &&
    (lower.includes("restrict") || lower.includes("whitelist"))
  ) {
    return "wallet_binance_error_ip";
  }

  if (raw.includes("-2015") || lower.includes("invalid api-key")) {
    return env === "demo"
      ? "wallet_binance_error_demo_keys"
      : "wallet_binance_error_live_keys";
  }

  return "deposit_provider_unavailable";
}
