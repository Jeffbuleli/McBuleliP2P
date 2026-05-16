import type { BotEnvironment } from "@/lib/bot-config";
import type { StoredBinanceCredentials } from "@/lib/bot-keys-crypto";
import { binanceUserSignedGet } from "@/lib/binance-user-client";

export type BinancePermissionCheck = {
  spotOk: boolean;
  futuresOk: boolean;
  spotError: string | null;
  futuresError: string | null;
};

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
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
    }
  }

  return { spotOk, futuresOk, spotError, futuresError };
}

export function permissionsMeetPlan(args: {
  planRequiresSpot: boolean;
  planRequiresFutures: boolean;
  check: BinancePermissionCheck;
}): { ok: boolean; reason: string | null } {
  if (args.planRequiresSpot && !args.check.spotOk) {
    return {
      ok: false,
      reason: args.check.spotError ?? "Spot API access failed",
    };
  }
  if (args.planRequiresFutures && !args.check.futuresOk) {
    return {
      ok: false,
      reason: args.check.futuresError ?? "Futures API access failed",
    };
  }
  return { ok: true, reason: null };
}
