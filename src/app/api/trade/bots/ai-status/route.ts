import { NextResponse } from "next/server";
import { extractXAnalystInsight, getAiSignalStatus } from "@/lib/bot-ai-signal";
import { getUserBotInstanceById } from "@/lib/bot-instance-service";
import { parseBotFuturesConfig } from "@/lib/bot-futures-config";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const instanceId = new URL(req.url).searchParams.get("instanceId")?.trim();
  if (!instanceId) {
    return NextResponse.json({ error: "bots_invalid_query" }, { status: 400 });
  }

  const instance = await getUserBotInstanceById(userId, instanceId);
  if (!instance || instance.planId !== "futures_um") {
    return NextResponse.json({ error: "bots_instance_not_found" }, { status: 404 });
  }

  const cfg = parseBotFuturesConfig(instance.config);
  if (!cfg?.aiAssistMode) {
    return NextResponse.json({ enabled: false });
  }

  const maxAgeMs = cfg.aiSignalMaxAgeMs;
  const status = await getAiSignalStatus(instanceId, maxAgeMs);
  const sig = status.signal;

  const reasons = sig?.reasons ?? [];
  const xInsight = extractXAnalystInsight(reasons);

  return NextResponse.json({
    enabled: true,
    fresh: status.fresh,
    ageMs: status.ageMs,
    maxAgeMs: status.maxAgeMs,
    action: sig?.action ?? null,
    confidence: sig?.confidence ?? null,
    riskLevel: sig?.risk_level ?? null,
    receivedAt: sig?.receivedAt ?? null,
    symbol: sig?.symbol ?? null,
    sentimentScore: sig?.sentiment_score ?? null,
    xInsight,
    xPositionAction: sig?.x_position_action ?? null,
    xNewDirection: sig?.x_new_direction ?? null,
    xSentiment: sig?.x_sentiment ?? null,
    reasons: reasons.slice(0, 6),
  });
}
