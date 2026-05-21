import { NextResponse } from "next/server";
import { z } from "zod";
import { getBotInstanceById, storeAiSignal, type AiSignalAction } from "@/lib/bot-ai-signal";
import { getCronSecret } from "@/lib/pool-env";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  instanceId: z.string().uuid(),
  signal: z.object({
    version: z.number().int().optional(),
    symbol: z.string().min(3),
    action: z.enum(["LONG", "SHORT", "HOLD"]),
    confidence: z.number().min(0).max(100),
    strategy: z.string().optional(),
    risk_level: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    timeframe: z.string().optional(),
    technical_score: z.number().optional(),
    combined_score: z.number().optional(),
    sentiment_score: z.number().optional(),
    reasons: z.array(z.string()).optional(),
    ts: z.string().optional(),
    x_position_action: z
      .enum(["close_now", "close_and_reverse", "monitor", "no_action"])
      .optional(),
    x_new_direction: z.enum(["LONG", "SHORT"]).optional(),
    x_sentiment: z.string().optional(),
    x_reason: z.string().optional(),
  }),
});

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (secret !== getCronSecret()) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { instanceId, signal } = parsed.data;
  const inst = await getBotInstanceById(instanceId);
  if (!inst) {
    return NextResponse.json({ error: "instance_not_found" }, { status: 404 });
  }
  if (inst.planId !== "futures_um") {
    return NextResponse.json({ error: "futures_instance_only" }, { status: 400 });
  }

  const stored = await storeAiSignal(instanceId, {
    version: signal.version ?? 1,
    symbol: signal.symbol,
    action: signal.action as AiSignalAction,
    confidence: Math.round(signal.confidence),
    strategy: signal.strategy ?? "FUTURES",
    risk_level: signal.risk_level ?? "MEDIUM",
    timeframe: signal.timeframe ?? "15m",
    technical_score: signal.technical_score ?? 0,
    combined_score: signal.combined_score ?? 0,
    sentiment_score: signal.sentiment_score ?? 0,
    reasons: signal.reasons ?? [],
    ts: signal.ts ?? new Date().toISOString(),
    x_position_action: signal.x_position_action,
    x_new_direction: signal.x_new_direction,
    x_sentiment: signal.x_sentiment,
    x_reason: signal.x_reason,
  });

  return NextResponse.json({
    ok: true,
    instanceId,
    receivedAt: stored.receivedAt,
    action: stored.action,
    confidence: stored.confidence,
  });
}
