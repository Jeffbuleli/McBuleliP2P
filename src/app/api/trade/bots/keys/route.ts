import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import {
  BOT_PLANS,
  type BotEnvironment,
  type BotPlanId,
} from "@/lib/bot-config";
import {
  deleteUserBinanceCredentials,
  listUserBinanceCredentials,
  saveUserBinanceCredentials,
} from "@/lib/bot-credentials-service";
import {
  permissionsMeetPlan,
  validateBinanceApiPermissions,
} from "@/lib/binance-api-validate";
import { getActiveBotSubscription } from "@/lib/bot-subscription-service";

const connectZ = z.object({
  environment: z.enum(["demo", "live"]),
  apiKey: z.string().trim().min(16).max(128),
  apiSecret: z.string().trim().min(16).max(128),
  /** Optional: validate against a plan the user is subscribing to */
  planId: z.enum(["dca_spot", "grid_spot", "futures_um"]).optional(),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const credentials = await listUserBinanceCredentials(userId);
  return NextResponse.json({ credentials });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    !process.env.BOT_KEYS_ENCRYPTION_SECRET?.trim() ||
    process.env.BOT_KEYS_ENCRYPTION_SECRET.trim().length < 32
  ) {
    return NextResponse.json(
      { error: "bots_encryption_not_configured" },
      { status: 503 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = connectZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "bots_invalid_body" }, { status: 400 });
  }

  const { environment, apiKey, apiSecret, planId } = parsed.data;
  const env = environment as BotEnvironment;

  let requiresSpot = true;
  let requiresFutures = false;
  if (planId) {
    const p = BOT_PLANS[planId as BotPlanId];
    requiresSpot = p.requiresSpot;
    requiresFutures = p.requiresFutures;
    const sub = await getActiveBotSubscription(userId, planId as BotPlanId);
    if (!sub || sub.billing !== environment) {
      return NextResponse.json(
        { error: "bots_subscription_required_for_keys" },
        { status: 409 },
      );
    }
  }

  const creds = { apiKey, apiSecret };
  const check = await validateBinanceApiPermissions({
    environment: env,
    creds,
    checkFutures: requiresFutures,
  });

  const meet = permissionsMeetPlan({
    planRequiresSpot: requiresSpot,
    planRequiresFutures: requiresFutures,
    check,
  });
  if (!meet.ok) {
    return NextResponse.json(
      {
        error: meet.errorCode ?? "bots_permissions_failed",
        check,
        detail: meet.reason,
      },
      { status: 400 },
    );
  }

  const saved = await saveUserBinanceCredentials({
    userId,
    environment: env,
    creds,
    check,
  });

  return NextResponse.json({ ok: true, credential: saved, check });
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const environment = searchParams.get("environment");
  if (environment !== "demo" && environment !== "live") {
    return NextResponse.json({ error: "bots_invalid_environment" }, { status: 400 });
  }
  const removed = await deleteUserBinanceCredentials(
    userId,
    environment as BotEnvironment,
  );
  if (!removed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
