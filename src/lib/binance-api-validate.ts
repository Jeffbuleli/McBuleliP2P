import type { BotEnvironment } from "@/lib/bot-config";
import type { StoredBinanceCredentials } from "@/lib/bot-keys-crypto";
import { binanceUserSignedGet } from "@/lib/binance-user-client";

export type BinancePermissionCheck = {
  spotOk: boolean;
  futuresOk: boolean;
  spotError: string | null;
  futuresError: string | null;
  spotErrorCode: string | null;
  futuresErrorCode: string | null;
  /** Classic fapi vs Portfolio Margin papi (live). */
  futuresApiKind: "fapi" | "papi" | null;
};

export type BinanceApiRestrictions = {
  ipRestrict: boolean;
  enableReading: boolean;
  enableFutures: boolean;
  enablePortfolioMarginTrading: boolean;
  enableSpotAndMarginTrading: boolean;
};

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

/** Map Binance -2015 etc. to clearer codes for i18n. */
export function classifyBinanceAuthError(
  environment: BotEnvironment,
  market: "spot" | "futures" | "portfolio",
  raw: string,
): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes("ip") &&
    (lower.includes("restrict") || lower.includes("whitelist"))
  ) {
    return "bots_error_ip_restrict";
  }
  if (raw.includes("-2015") || lower.includes("invalid api-key")) {
    if (environment === "demo") {
      return market === "spot"
        ? "bots_error_demo_spot_keys"
        : "bots_error_demo_futures_keys";
    }
    if (market === "portfolio") {
      return "bots_error_live_portfolio_margin_keys";
    }
    return market === "futures"
      ? "bots_error_live_futures_keys"
      : "bots_error_live_spot_keys";
  }
  return "bots_error_binance_generic";
}

/** Live only — GET /sapi/v1/account/apiRestrictions */
export async function fetchBinanceApiRestrictions(
  environment: BotEnvironment,
  creds: StoredBinanceCredentials,
): Promise<BinanceApiRestrictions | null> {
  if (environment !== "live") return null;
  try {
    const json = (await binanceUserSignedGet({
      environment,
      creds,
      market: "spot",
      path: "/sapi/v1/account/apiRestrictions",
    })) as BinanceApiRestrictions;
    return json;
  } catch {
    return null;
  }
}

async function validateFuturesAccess(args: {
  environment: BotEnvironment;
  creds: StoredBinanceCredentials;
}): Promise<{
  ok: boolean;
  kind: "fapi" | "papi" | null;
  error: string | null;
  errorCode: string | null;
}> {
  const { environment, creds } = args;

  if (environment === "demo") {
    try {
      await binanceUserSignedGet({
        environment,
        creds,
        market: "futures",
        path: "/fapi/v2/balance",
      });
      return { ok: true, kind: "fapi", error: null, errorCode: null };
    } catch (e) {
      const error = errMessage(e);
      return {
        ok: false,
        kind: null,
        error,
        errorCode: classifyBinanceAuthError(environment, "futures", error),
      };
    }
  }

  const restrictions = await fetchBinanceApiRestrictions(environment, creds);
  const portfolioMargin = restrictions?.enablePortfolioMarginTrading === true;

  async function tryPapi() {
    await binanceUserSignedGet({
      environment,
      creds,
      market: "portfolio",
      path: "/papi/v1/um/account",
    });
    return { ok: true as const, kind: "papi" as const, error: null, errorCode: null };
  }

  async function tryFapi() {
    await binanceUserSignedGet({
      environment,
      creds,
      market: "futures",
      path: "/fapi/v2/balance",
    });
    return { ok: true as const, kind: "fapi" as const, error: null, errorCode: null };
  }

  if (portfolioMargin) {
    try {
      return await tryPapi();
    } catch (e) {
      const papiErr = errMessage(e);
      const papiCode = classifyBinanceAuthError(environment, "portfolio", papiErr);
      if (papiCode === "bots_error_ip_restrict") {
        return { ok: false, kind: null, error: papiErr, errorCode: papiCode };
      }
      try {
        return await tryFapi();
      } catch {
        return { ok: false, kind: null, error: papiErr, errorCode: papiCode };
      }
    }
  }

  try {
    return await tryFapi();
  } catch (e) {
    const error = errMessage(e);
    const code = classifyBinanceAuthError(environment, "futures", error);
    if (code === "bots_error_ip_restrict") {
      return { ok: false, kind: null, error, errorCode: code };
    }
    try {
      return await tryPapi();
    } catch (e2) {
      const err2 = errMessage(e2);
      return {
        ok: false,
        kind: null,
        error: err2,
        errorCode: classifyBinanceAuthError(environment, "portfolio", err2),
      };
    }
  }
}

export async function validateBinanceApiPermissions(args: {
  environment: BotEnvironment;
  creds: StoredBinanceCredentials;
  checkSpot?: boolean;
  checkFutures: boolean;
}): Promise<BinancePermissionCheck> {
  let spotOk = false;
  let futuresOk = false;
  let spotError: string | null = null;
  let futuresError: string | null = null;
  let spotErrorCode: string | null = null;
  let futuresErrorCode: string | null = null;
  let futuresApiKind: "fapi" | "papi" | null = null;

  const checkSpot = args.checkSpot !== false;

  if (checkSpot) {
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
  }

  if (args.checkFutures) {
    const fut = await validateFuturesAccess({
      environment: args.environment,
      creds: args.creds,
    });
    futuresOk = fut.ok;
    futuresApiKind = fut.kind;
    futuresError = fut.error;
    futuresErrorCode = fut.errorCode;
  }

  return {
    spotOk,
    futuresOk,
    spotError,
    futuresError,
    spotErrorCode,
    futuresErrorCode,
    futuresApiKind,
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
