import type { BotEnvironment } from "@/lib/bot-config";
import type { StoredBinanceCredentials } from "@/lib/bot-keys-crypto";
import { binanceUserSignedGet } from "@/lib/binance-user-client";

export type BinancePermissionCheck = {
  spotOk: boolean;
  futuresOk: boolean;
  spotError: string | null;
  futuresError: string | null;
  /** Machine-readable hint for UI (e.g. env mismatch). */
  spotErrorCode: string | null;
  futuresErrorCode: string | null;
};

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

/** Map Binance -2015 etc. to clearer codes for i18n. */
export function classifyBinanceAuthError(
  environment: BotEnvironment,
  market: "spot" | "futures",
  raw: string,
): string {
  const lower = raw.toLowerCase();
  if (raw.includes("-2015") || lower.includes("invalid api-key")) {
    if (environment === "demo") {
      return market === "futures"
        ? "bots_error_demo_futures_keys"
        : "bots_error_demo_spot_keys";
    }
    return market === "futures"
      ? "bots_error_live_futures_keys"
      : "bots_error_live_spot_keys";
  }
  if (lower.includes("ip") && lower.includes("restrict")) {
    return "bots_error_ip_restrict";
  }
  return "bots_error_binance_generic";
}

export async function validateBinanceApiPermissions(args: {
  environment: BotEnvironment;
  creds: StoredBinanceCredentials;
  checkFutures: boolean;
}): Promise<BinancePermissionCheck> {
  let spotOk = false;
  let futuresOk = false;
  let spotError: string | null = null;
  let futuresError: string | null = null;
  let spotErrorCode: string | null = null;
  let futuresErrorCode: string | null = null;

  try {
    await binanceUserSignedGet({
      environment: args.environment,
      creds: args.creds,
      market: "spot",
      path: "/api/v3/account",
    });
    spotOk = true;
  } catch (e) {
    spotError = errMessage(e);
    spotErrorCode = classifyBinanceAuthError(
      args.environment,
      "spot",
      spotError,
    );
  }

  if (args.checkFutures) {
    try {
      await binanceUserSignedGet({
        environment: args.environment,
        creds: args.creds,
        market: "futures",
        path: "/fapi/v2/balance",
      });
      futuresOk = true;
    } catch (e) {
      futuresError = errMessage(e);
      futuresErrorCode = classifyBinanceAuthError(
        args.environment,
        "futures",
        futuresError,
      );
    }
  }

  return {
    spotOk,
    futuresOk,
    spotError,
    futuresError,
    spotErrorCode,
    futuresErrorCode,
  };
}

export function permissionsMeetPlan(args: {
  planRequiresSpot: boolean;
  planRequiresFutures: boolean;
  check: BinancePermissionCheck;
}): { ok: boolean; reason: string | null; errorCode: string | null } {
  if (args.planRequiresSpot && !args.check.spotOk) {
    return {
      ok: false,
      reason: args.check.spotError ?? "Spot API access failed",
      errorCode: args.check.spotErrorCode,
    };
  }
  if (args.planRequiresFutures && !args.check.futuresOk) {
    return {
      ok: false,
      reason: args.check.futuresError ?? "Futures API access failed",
      errorCode: args.check.futuresErrorCode,
    };
  }
  return { ok: true, reason: null, errorCode: null };
}
